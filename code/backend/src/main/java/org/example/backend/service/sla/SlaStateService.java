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

        // Calculate score
        int baseScore = 100;
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) {
            baseScore = 0;
        } else if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) {
            if (evaluation.overdueDays() == 1) {
                baseScore = 30;
            } else if (evaluation.overdueDays() == 2) {
                baseScore = 15;
            } else {
                baseScore = 30;
            }
        } else if (evaluation.has(TaskSlaCategory.DUE_TODAY)) {
            baseScore = 45;
        } else if (evaluation.has(TaskSlaCategory.DUE_TOMORROW)) {
            baseScore = 60;
        } else if (evaluation.has(TaskSlaCategory.DUE_IN_2_DAYS)) {
            baseScore = 75;
        } else if (evaluation.has(TaskSlaCategory.DUE_IN_3_DAYS)) {
            baseScore = 85;
        }

        int score = baseScore;
        if (evaluation.has(TaskSlaCategory.BLOCKED)) {
            score -= 20;
        }
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            score -= 25;
        }
        score = Math.max(0, Math.min(100, score));

        // Calculate riskLevel
        String riskLevel = "LOW";
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY) || score <= 20) {
            riskLevel = "CRITICAL";
        } else if (score <= 45) {
            riskLevel = "HIGH";
        } else if (score <= 75) {
            riskLevel = "MEDIUM";
        } else if (score < 100) {
            riskLevel = "LOW";
        } else if (score == 100) {
            if (evaluation.categories().size() == 1 && evaluation.has(TaskSlaCategory.NORMAL)) {
                riskLevel = "NORMAL";
            } else {
                riskLevel = "LOW";
            }
        }

        // Calculate reasons
        List<String> reasons = new ArrayList<>();
        if (evaluation.has(TaskSlaCategory.DUE_IN_3_DAYS)) reasons.add("Task deadline is in 3 days.");
        if (evaluation.has(TaskSlaCategory.DUE_IN_2_DAYS)) reasons.add("Task deadline is in 2 days.");
        if (evaluation.has(TaskSlaCategory.DUE_TOMORROW)) reasons.add("Task deadline is tomorrow.");
        if (evaluation.has(TaskSlaCategory.DUE_TODAY)) reasons.add("Task deadline is today.");
        if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) {
            reasons.add("Task is overdue by " + evaluation.overdueDays() + " day(s), still in warning period.");
        }
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) {
            reasons.add("Task is overdue by " + evaluation.overdueDays() + " day(s) and qualifies for penalty.");
        }
        if (evaluation.has(TaskSlaCategory.BLOCKED)) reasons.add("Task is blocked.");
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) reasons.add("Task is missing accepted evidence.");
        if (reasons.isEmpty() && evaluation.has(TaskSlaCategory.NORMAL)) {
            reasons.add("Task SLA is normal.");
        }

        // Calculate recommended action
        List<String> actions = new ArrayList<>();
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) actions.add("Escalate this task and request recovery action.");
        else if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) actions.add("Follow up before this task becomes penalized.");
        else if (evaluation.has(TaskSlaCategory.DUE_TODAY)) actions.add("Finish or update this task before the end of today.");
        else if (evaluation.has(TaskSlaCategory.DUE_TOMORROW)) actions.add("Prepare to complete this task by tomorrow.");
        else if (evaluation.has(TaskSlaCategory.DUE_IN_2_DAYS) || evaluation.has(TaskSlaCategory.DUE_IN_3_DAYS)) {
            actions.add("Plan remaining work before the deadline.");
        }
        if (evaluation.has(TaskSlaCategory.BLOCKED)) actions.add("Clarify blocker and request leader support.");
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) actions.add("Upload or request accepted evidence.");
        String recommendedAction = actions.isEmpty() ? "No action required." : String.join(" ", actions);

        // Override SLA metrics for completed tasks to resolve SLA properly
        if (task.getStatus() == TaskStatus.DONE) {
            score = 100;
            riskLevel = "NORMAL";
            reasons = List.of("Task is resolved (DONE).");
            recommendedAction = "No action required.";
        }

        LocalDate today = LocalDate.now(clock);
        Long daysUntilDeadline = task.getDeadline() != null ? ChronoUnit.DAYS.between(today, task.getDeadline()) : null;

        List<String> categoriesList = evaluation.categories().stream().map(Enum::name).collect(Collectors.toList());
        String categoriesJson = toJson(categoriesList);
        String reasonsJson = toJson(reasons);

        // Load existing state
        TaskSlaState oldState = taskSlaStateRepository.findById(taskId).orElse(null);

        boolean changed = oldState == null
                || oldState.getCurrentScore() != score
                || !Objects.equals(oldState.getCurrentRiskLevel(), riskLevel)
                || oldState.getOverdueDays() != evaluation.overdueDays()
                || oldState.isHasAcceptedEvidence() != evaluation.hasAcceptedEvidence()
                || oldState.isPenaltyApplied() != task.isOverduePenaltyApplied()
                || !Objects.equals(oldState.getCategoriesJson(), categoriesJson);

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
            newState.setHasAcceptedEvidence(evaluation.hasAcceptedEvidence());
            newState.setPenaltyApplied(task.isOverduePenaltyApplied());
            newState.setEvaluatedAt(LocalDateTime.now());

            taskSlaStateRepository.save(newState);
        }

        // Execute actions via SlaActionService
        String actionTaken = slaActionService.executeActions(task, evaluation);

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
