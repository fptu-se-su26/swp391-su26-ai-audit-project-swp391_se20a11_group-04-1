package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.NotificationEntityType;
import org.example.backend.entity.NotificationType;
import org.example.backend.entity.ProjectMember;
import org.example.backend.entity.SlaActionLog;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskSlaState;
import org.example.backend.entity.TaskStatus;
import org.example.backend.entity.UserAccount;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.SlaActionLogRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.example.backend.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlaActionService {

    private final NotificationService notificationService;
    private final TaskPenaltyService taskPenaltyService;
    private final SlaActionLogRepository slaActionLogRepository;
    private final TaskSlaStateRepository taskSlaStateRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final Clock clock;

    @Transactional
    public String executeActions(Task task, TaskSlaEvaluation evaluation,
                                 SlaRiskAssessmentService.AssessmentResult assessment) {
        List<String> actions = new ArrayList<>();
        Long projectId = task.getProject().getId();
        Long taskId = task.getId();
        int score = assessment != null ? assessment.getScore() : 100;

        if (task.getStatus() == TaskStatus.DONE) {
            String actionKey = buildActionKey(projectId, taskId, "SYSTEM", "RESOLVE_SLA", "HEALTHY");
            if (slaActionLogRepository.existsByActionKey(actionKey)) {
                actions.add("SKIPPED_DUPLICATE_ACTION");
            } else {
                TaskSlaState oldState = taskSlaStateRepository.findById(taskId).orElse(null);
                if (oldState == null || !"HEALTHY".equals(oldState.getCurrentRiskLevel())) {
                    saveActionLog(projectId, task, null, "RESOLVE_SLA", "HEALTHY", actionKey, "EXECUTED",
                            "Task is completed (DONE) and SLA state resolved to HEALTHY.");
                    actions.add("RESOLVE_SLA");
                } else {
                    saveActionLog(projectId, task, null, "RESOLVE_SLA", "HEALTHY", actionKey, "SKIPPED_DUPLICATE",
                            "Task was already in HEALTHY state.");
                    actions.add("SKIPPED_DUPLICATE_ACTION");
                }
            }
            return String.join(",", actions);
        }

        executeNotificationPolicy(task, assessment, actions, projectId, score);

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

    private void executeNotificationPolicy(Task task, SlaRiskAssessmentService.AssessmentResult assessment,
                                           List<String> actions, Long projectId, int score) {
        if (score >= 90) {
            actions.add("NO_DIRECT_REMINDER");
            return;
        }
        if (score >= 76) {
            actions.add("DIGEST_ONLY");
            return;
        }

        String category = resolveRiskCategory(score);
        String title = buildNotificationTitle(score);
        String message = buildNotificationMessage(task, assessment, score);

        if (task.getPrimaryAssignee() != null) {
            notifyRecipient(actions, projectId, task, task.getPrimaryAssignee(), "NOTIFY_ASSIGNEE",
                    category, title, message);
        }
        if (score <= 45) {
            notifyLeaders(actions, projectId, task, category, title, message);
        }
        if (score <= 20) {
            actions.add("RECOVERY_PLAN_REQUIRED");
        }
    }

    private void notifyLeaders(List<String> actions, Long projectId, Task task, String category,
                               String title, String message) {
        Map<Long, UserAccount> recipients = new LinkedHashMap<>();
        addRoleRecipients(recipients, projectId, "LEADER");
        addRoleRecipients(recipients, projectId, "PROJECT_LEADER");
        addRoleRecipients(recipients, projectId, "MENTOR");

        for (UserAccount recipient : recipients.values()) {
            notifyRecipient(actions, projectId, task, recipient, "NOTIFY_LEADER", category, title, message);
        }
    }

    private void addRoleRecipients(Map<Long, UserAccount> recipients, Long projectId, String roleName) {
        List<ProjectMember> members = projectMemberRepository.findByProjectIdAndRoleName(projectId, roleName);
        for (ProjectMember member : members) {
            UserAccount user = member.getUser();
            if (user != null && user.getId() != null) {
                recipients.putIfAbsent(user.getId(), user);
            }
        }
    }

    private void notifyRecipient(List<String> actions, Long projectId, Task task, UserAccount recipient,
                                 String actionType, String category, String title, String message) {
        Long recipientId = recipient.getId();
        String actionKey = buildActionKey(projectId, task.getId(), String.valueOf(recipientId), actionType, category);
        if (slaActionLogRepository.existsByActionKey(actionKey)) {
            actions.add("SKIPPED_DUPLICATE_NOTIFICATION");
            return;
        }

        try {
            notificationService.createAndPush(
                    recipient,
                    task.getProject(),
                    NotificationEntityType.TASK,
                    task.getId(),
                    NotificationType.SYSTEM,
                    title,
                    message
            );
            saveActionLog(projectId, task, recipientId, actionType, category, actionKey, "EXECUTED",
                    "Notification pushed: " + title);
            actions.add(actionType.equals("NOTIFY_LEADER") ? "NOTIFIED_LEADER" : "NOTIFIED_ASSIGNEE");
        } catch (Exception ex) {
            saveActionLog(projectId, task, recipientId, actionType, category, actionKey, "FAILED", ex.getMessage());
            throw ex;
        }
    }

    private String resolveRiskCategory(int score) {
        if (score <= 20) {
            return "CRITICAL_RISK";
        }
        if (score <= 45) {
            return "HIGH_RISK";
        }
        return "MEDIUM_RISK";
    }

    private String buildNotificationTitle(int score) {
        if (score <= 20) {
            return "Critical SLA risk needs recovery";
        }
        if (score <= 45) {
            return "High SLA risk needs attention";
        }
        return "Task needs attention";
    }

    private String buildNotificationMessage(Task task, SlaRiskAssessmentService.AssessmentResult assessment, int score) {
        StringBuilder message = new StringBuilder("Task \"")
                .append(task.getTitle())
                .append("\" has SLA risk score ")
                .append(score)
                .append(".");
        if (task.getDeadline() != null) {
            message.append(" Deadline: ").append(task.getDeadline()).append(".");
        }
        if (assessment != null && assessment.getRecommendedAction() != null && !assessment.getRecommendedAction().isBlank()) {
            message.append(" Suggested action: ").append(assessment.getRecommendedAction());
        }
        return message.toString();
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
