package org.example.backend.service.sla;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.SlaDecisionPackResponse;
import org.example.backend.entity.SlaActionLog;
import org.example.backend.entity.SlaDecisionLog;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskSlaState;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.SlaActionLogRepository;
import org.example.backend.repository.SlaDecisionLogRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaDecisionPackService {

    private final TaskRepository taskRepository;
    private final TaskSlaStateRepository taskSlaStateRepository;
    private final SlaDecisionLogRepository slaDecisionLogRepository;
    private final SlaActionLogRepository slaActionLogRepository;
    private final SlaStateService slaStateService;
    private final ObjectMapper objectMapper;

    @Transactional
    public SlaDecisionPackResponse getTaskDecisionPack(Long projectId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        if (!task.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Task ID: " + taskId + " does not belong to Project ID: " + projectId);
        }

        // Fetch SLA state. If missing, evaluate on the fly.
        TaskSlaState state = taskSlaStateRepository.findByTaskIdAndProjectId(taskId, projectId).orElse(null);
        if (state == null) {
            log.info("TaskSlaState not found for taskId {} in projectId {}, triggering SLA evaluation on the fly", taskId, projectId);
            slaStateService.evaluateAndPersist(taskId, "API_TRIGGER");
            state = taskSlaStateRepository.findByTaskIdAndProjectId(taskId, projectId).orElse(null);
        }

        // Fetch recent decisions and actions (up to 5 items)
        List<SlaDecisionLog> decisions = slaDecisionLogRepository.findTop5ByTaskIdAndProjectIdOrderByEvaluatedAtDesc(taskId, projectId);
        List<SlaActionLog> actions = slaActionLogRepository.findTop5ByTaskIdAndProjectIdOrderByCreatedAtDesc(taskId, projectId);

        List<String> slaCategories = new ArrayList<>();
        List<String> reasons = new ArrayList<>();
        List<String> predictionReasons = new ArrayList<>();
        SlaDecisionPackResponse.ScoreBreakdown scoreBreakdown = null;

        if (state != null) {
            try {
                if (state.getCategoriesJson() != null) {
                    slaCategories = objectMapper.readValue(state.getCategoriesJson(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ex) {
                log.error("Failed to parse categoriesJson for taskId {}", taskId, ex);
            }

            try {
                if (state.getReasonsJson() != null) {
                    reasons = objectMapper.readValue(state.getReasonsJson(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ex) {
                log.error("Failed to parse reasonsJson for taskId {}", taskId, ex);
            }

            try {
                if (state.getPredictionReasonsJson() != null) {
                    predictionReasons = objectMapper.readValue(state.getPredictionReasonsJson(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ex) {
                log.error("Failed to parse predictionReasonsJson for taskId {}", taskId, ex);
            }

            try {
                if (state.getScoreBreakdownJson() != null) {
                    scoreBreakdown = objectMapper.readValue(state.getScoreBreakdownJson(), SlaDecisionPackResponse.ScoreBreakdown.class);
                }
            } catch (Exception ex) {
                log.error("Failed to parse scoreBreakdownJson for taskId {}", taskId, ex);
            }
        }

        List<SlaDecisionPackResponse.DecisionLogItem> recentDecisions = decisions.stream().map(logItem ->
                SlaDecisionPackResponse.DecisionLogItem.builder()
                        .eventType(logItem.getEventType())
                        .previousScore(logItem.getPreviousScore())
                        .newScore(logItem.getNewScore())
                        .previousRiskLevel(logItem.getPreviousRiskLevel())
                        .newRiskLevel(logItem.getNewRiskLevel())
                        .actionTaken(logItem.getActionTaken())
                        .evaluatedAt(logItem.getEvaluatedAt())
                        .build()
        ).collect(Collectors.toList());

        List<SlaDecisionPackResponse.ActionLogItem> recentActions = actions.stream().map(logItem ->
                SlaDecisionPackResponse.ActionLogItem.builder()
                        .actionType(logItem.getActionType())
                        .slaCategory(logItem.getSlaCategory())
                        .status(logItem.getStatus())
                        .message(logItem.getMessage())
                        .createdAt(logItem.getCreatedAt())
                        .build()
        ).collect(Collectors.toList());

        String latestEventType = decisions.isEmpty() ? "UNKNOWN" : decisions.get(0).getEventType();
        String latestActionTaken = decisions.isEmpty() ? "NO_ACTION" : decisions.get(0).getActionTaken();

        if (state == null) {
            return SlaDecisionPackResponse.builder()
                    .taskId(taskId)
                    .projectId(projectId)
                    .currentScore(100)
                    .currentRiskLevel("NORMAL")
                    .burnRateLevel("LOW")
                    .predictedRiskLevel("NORMAL")
                    .predictionReasons(List.of())
                    .slaCategories(List.of("NORMAL"))
                    .reasons(List.of("SLA has not been evaluated yet."))
                    .recommendedAction("No action required.")
                    .recentDecisions(List.of())
                    .recentActions(List.of())
                    .build();
        }

        return SlaDecisionPackResponse.builder()
                .taskId(state.getTaskId())
                .projectId(state.getProjectId())
                .sprintId(state.getSprintId())
                .assigneeId(state.getAssigneeId())
                .currentScore(state.getCurrentScore())
                .currentRiskLevel(state.getCurrentRiskLevel())
                .slaCategories(slaCategories)
                .reasons(reasons)
                .recommendedAction(state.getRecommendedAction())
                .overdueDays(state.getOverdueDays())
                .daysUntilDeadline(state.getDaysUntilDeadline())
                .penaltyApplied(state.isPenaltyApplied())
                .burnGap(state.getBurnGap() != null ? state.getBurnGap() : 0.0)
                .burnRateLevel(state.getBurnRateLevel())
                .spi(state.getSpi() != null ? state.getSpi() : 1.0)
                .predictedRiskLevel(state.getPredictedRiskLevel())
                .predictionReasons(predictionReasons)
                .scoreBreakdown(scoreBreakdown)
                .evaluatedAt(state.getEvaluatedAt())
                .latestEventType(latestEventType)
                .latestActionTaken(latestActionTaken)
                .recentDecisions(recentDecisions)
                .recentActions(recentActions)
                .build();
    }
}
