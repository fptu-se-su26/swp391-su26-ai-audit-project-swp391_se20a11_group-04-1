package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.NotificationEntityType;
import org.example.backend.entity.NotificationType;
import org.example.backend.entity.SlaActionLog;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskSlaState;
import org.example.backend.entity.TaskStatus;
import org.example.backend.repository.SlaActionLogRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.example.backend.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaActionService {

    private final NotificationService notificationService;
    private final TaskPenaltyService taskPenaltyService;
    private final SlaActionLogRepository slaActionLogRepository;
    private final TaskSlaStateRepository taskSlaStateRepository;
    private final Clock clock;

    @Transactional
    public String executeActions(Task task, TaskSlaEvaluation evaluation) {
        List<String> actions = new ArrayList<>();
        Long projectId = task.getProject().getId();
        Long taskId = task.getId();

        if (task.getStatus() == TaskStatus.DONE && !evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            String actionKey = buildActionKey(projectId, taskId, "SYSTEM", "RESOLVE_SLA", "NORMAL");
            if (slaActionLogRepository.existsByActionKey(actionKey)) {
                actions.add("SKIPPED_DUPLICATE_ACTION");
            } else {
                TaskSlaState oldState = taskSlaStateRepository.findById(taskId).orElse(null);
                if (oldState == null || !"NORMAL".equals(oldState.getCurrentRiskLevel())) {
                    saveActionLog(projectId, task, null, "RESOLVE_SLA", "NORMAL", actionKey, "EXECUTED",
                            "Task is completed (DONE) and SLA state resolved to NORMAL.");
                    actions.add("RESOLVE_SLA");
                } else {
                    saveActionLog(projectId, task, null, "RESOLVE_SLA", "NORMAL", actionKey, "SKIPPED_DUPLICATE",
                            "Task was already in NORMAL state.");
                    actions.add("SKIPPED_DUPLICATE_ACTION");
                }
            }
            return String.join(",", actions);
        }

        if (task.getPrimaryAssignee() != null) {
            String category = null;
            String notificationTitle = null;
            if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) {
                category = "OVERDUE_PENALTY";
                notificationTitle = "SLA task quÃ¡ háº¡n";
            } else if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) {
                category = "OVERDUE_SHORT";
                notificationTitle = "Cảnh báo task quá hạn";
            } else if (evaluation.has(TaskSlaCategory.DUE_TODAY)) {
                category = "DUE_TODAY";
                notificationTitle = "Nhắc deadline hôm nay";
            } else if (evaluation.has(TaskSlaCategory.DUE_TOMORROW)) {
                category = "DUE_TOMORROW";
                notificationTitle = "Nhắc deadline ngày mai";
            }

            if (category != null) {
                Long assigneeId = task.getPrimaryAssignee().getId();
                String actionKey = buildActionKey(projectId, taskId, String.valueOf(assigneeId), "NOTIFY_ASSIGNEE", category);
                if (slaActionLogRepository.existsByActionKey(actionKey)) {
                    actions.add("SKIPPED_DUPLICATE_NOTIFICATION");
                } else {
                    try {
                        String notificationMessage = "Task \"" + task.getTitle() + "\" có deadline " + task.getDeadline() + ".";
                        notificationService.createAndPush(
                                task.getPrimaryAssignee(),
                                task.getProject(),
                                NotificationEntityType.TASK,
                                taskId,
                                NotificationType.SYSTEM,
                                notificationTitle,
                                notificationMessage
                        );
                        saveActionLog(projectId, task, assigneeId, "NOTIFY_ASSIGNEE", category, actionKey, "EXECUTED",
                                "Notification pushed: " + notificationTitle);
                        actions.add("NOTIFIED_ASSIGNEE");
                    } catch (Exception ex) {
                        saveActionLog(projectId, task, assigneeId, "NOTIFY_ASSIGNEE", category, actionKey, "FAILED",
                                ex.getMessage());
                        throw ex;
                    }
                }
            }
        }

        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) {
            String actionKey = buildActionKey(projectId, taskId, "SYSTEM", "APPLY_PENALTY", "OVERDUE_PENALTY");
            if (slaActionLogRepository.existsByActionKey(actionKey)) {
                actions.add("SKIPPED_DUPLICATE_PENALTY");
            } else {
                if (task.isOverduePenaltyApplied()) {
                    saveActionLog(projectId, task, null, "APPLY_PENALTY", "OVERDUE_PENALTY", actionKey,
                            "SKIPPED_DUPLICATE", "Penalty already applied on the task.");
                    actions.add("SKIPPED_DUPLICATE_PENALTY");
                } else {
                    try {
                        taskPenaltyService.applyPenaltyIfNeeded(task, evaluation);
                        saveActionLog(projectId, task, null, "APPLY_PENALTY", "OVERDUE_PENALTY", actionKey,
                                "EXECUTED", "Penalty applied successfully.");
                        actions.add("APPLIED_PENALTY");
                    } catch (Exception ex) {
                        saveActionLog(projectId, task, null, "APPLY_PENALTY", "OVERDUE_PENALTY", actionKey,
                                "FAILED", ex.getMessage());
                        throw ex;
                    }
                }
            }
        }

        return actions.isEmpty() ? "NO_ACTION" : String.join(",", actions);
    }

    private String buildActionKey(Long projectId, Long taskId, String recipient, String actionType, String category) {
        LocalDate today = LocalDate.now(clock);
        return projectId + ":" + taskId + ":" + recipient + ":" + actionType + ":" + category + ":" + today;
    }

    private void saveActionLog(Long projectId, Task task, Long recipientId, String actionType, String category,
                               String actionKey, String status, String message) {
        SlaActionLog actionLog = SlaActionLog.builder()
                .projectId(projectId)
                .task(task)
                .recipientId(recipientId)
                .actionType(actionType)
                .slaCategory(category)
                .actionKey(actionKey)
                .status(status)
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();
        slaActionLogRepository.save(actionLog);
    }
}
