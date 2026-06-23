package org.example.backend.service.sla;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.repository.SlaDecisionLogRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaStateService {

    private final TaskRepository taskRepository;
    private final TaskSlaStateRepository taskSlaStateRepository;
    private final SlaDecisionLogRepository slaDecisionLogRepository;
    private final TaskSlaRuleService taskSlaRuleService;
    private final SlaActionService slaActionService;
    private final SlaRiskAssessmentService slaRiskAssessmentService;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Transactional(readOnly = true)
    public boolean existsTask(Long taskId) {
        return taskRepository.existsById(taskId);
    }

    @Transactional
    public void evaluateAndPersist(Long taskId, String eventType) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            log.warn("Task not found with ID: {}, skipping SLA evaluation", taskId);
            return;
        }

        TaskSlaEvaluation evaluation = taskSlaRuleService.evaluate(task);

        SlaRiskAssessmentService.AssessmentResult assessment = slaRiskAssessmentService.assess(task, evaluation);
        int score = assessment.getScore();
        String riskLevel = assessment.getRiskLevel();
        List<String> reasons = assessment.getReasons();
        String recommendedAction = assessment.getRecommendedAction();

        LocalDate today = LocalDate.now(clock);
        Long daysUntilDeadline = task.getDeadline() != null ? ChronoUnit.DAYS.between(today, task.getDeadline()) : null;

        List<String> categoriesList = evaluation.categories().stream().map(Enum::name).collect(Collectors.toList());
        String categoriesJson = toJson(categoriesList);
        String reasonsJson = toJson(reasons);
        String predictionReasonsJson = toJson(assessment.getPredictionReasons());
        String scoreBreakdownJson = toJson(assessment.getScoreBreakdown());

        // Load existing state
        TaskSlaState oldState = taskSlaStateRepository.findById(taskId).orElse(null);

        boolean changed = oldState == null
                || oldState.getCurrentScore() != score
                || !Objects.equals(oldState.getCurrentRiskLevel(), riskLevel)
                || oldState.getOverdueDays() != evaluation.overdueDays()
                || oldState.isPenaltyApplied() != task.isOverduePenaltyApplied()
                || !Objects.equals(oldState.getCategoriesJson(), categoriesJson)
                || !Objects.equals(oldState.getBurnGap(), assessment.getBurnGap())
                || !Objects.equals(oldState.getBurnRateLevel(), assessment.getBurnRateLevel())
                || !Objects.equals(oldState.getSpi(), assessment.getSpi())
                || !Objects.equals(oldState.getPredictedRiskLevel(), assessment.getPredictedRiskLevel())
                || !Objects.equals(oldState.getPredictionReasonsJson(), predictionReasonsJson)
                || !Objects.equals(oldState.getScoreBreakdownJson(), scoreBreakdownJson);

        String previousRiskLevel = oldState != null ? oldState.getCurrentRiskLevel() : null;
        Integer previousScore = oldState != null ? oldState.getCurrentScore() : null;

        // Upsert state
        if (changed) {
            TaskSlaState newState = oldState;
            if (newState == null) {
                newState = new TaskSlaState();
                newState.setTask(task);
            }
            newState.setProjectId(task.getProject().getId());
            newState.setSprintId(task.getSprintId());
            newState.setAssigneeId(task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null);
            newState.setCurrentRiskLevel(riskLevel);
            newState.setCurrentScore(score);
            newState.setCategoriesJson(categoriesJson);
            newState.setReasonsJson(reasonsJson);
            newState.setRecommendedAction(recommendedAction);
            newState.setOverdueDays(evaluation.overdueDays());
            newState.setDaysUntilDeadline(daysUntilDeadline);
            newState.setPenaltyApplied(task.isOverduePenaltyApplied());
            newState.setBurnGap(assessment.getBurnGap());
            newState.setBurnRateLevel(assessment.getBurnRateLevel());
            newState.setSpi(assessment.getSpi());
            newState.setPredictedRiskLevel(assessment.getPredictedRiskLevel());
            newState.setPredictionReasonsJson(predictionReasonsJson);
            newState.setScoreBreakdownJson(scoreBreakdownJson);
            newState.setEvaluatedAt(LocalDateTime.now());

            taskSlaStateRepository.save(newState);
        }

        // Execute actions via SlaActionService
        String actionTaken = slaActionService.executeActions(task, evaluation, assessment);
        if (actionTaken != null && actionTaken.length() > 100) {
            actionTaken = actionTaken.substring(0, 97) + "...";
        }

        // Record log if state changed OR a significant action occurred
        if (changed || isExecutedAction(actionTaken)) {
            SlaDecisionLog decisionLog = SlaDecisionLog.builder()
                    .task(task)
                    .projectId(task.getProject().getId())
                    .sprintId(task.getSprintId())
                    .assigneeId(task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null)
                    .eventType(eventType)
                    .previousRiskLevel(previousRiskLevel)
                    .newRiskLevel(riskLevel)
                    .previousScore(previousScore)
                    .newScore(score)
                    .categoriesJson(categoriesJson)
                    .reasonsJson(reasonsJson)
                    .recommendedAction(recommendedAction)
                    .actionTaken(actionTaken)
                    .evaluatedAt(LocalDateTime.now())
                    .build();

            slaDecisionLogRepository.save(decisionLog);
            log.info("SLA state re-evaluated and persisted. Task: {}, Event: {}, OldScore: {}, NewScore: {}, OldRisk: {}, NewRisk: {}, Action: {}",
                    taskId, eventType, previousScore, score, previousRiskLevel, riskLevel, actionTaken);
        } else {
            log.debug("SLA state for task {} has not changed and no important action occurred. Skipping decision log.", taskId);
        }
    }

    private boolean isExecutedAction(String actionTaken) {
        if (actionTaken == null || "NO_ACTION".equals(actionTaken)) {
            return false;
        }
        String[] parts = actionTaken.split(",");
        for (String part : parts) {
            String p = part.trim();
            if (!p.startsWith("SKIPPED_") && !"SKIP_DUPLICATE_NOTIFICATION".equals(p)) {
                return true;
            }
        }
        return false;
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception ex) {
            log.error("Failed to serialize to JSON", ex);
            return "[]";
        }
    }
}
