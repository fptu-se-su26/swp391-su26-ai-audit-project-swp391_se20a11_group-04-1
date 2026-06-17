package org.example.backend.service.sla.executor;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.*;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.NotificationService;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

/**
 * Xử lý các action thông báo đến assignee:
 * NOTIFY_ASSIGNEE, REQUEST_EVIDENCE, ASK_BLOCKER_UPDATE
 */
@Component
@RequiredArgsConstructor
public class NotifyAssigneeExecutor implements RecoveryActionExecutor {

    private static final Map<RecoveryActionType, String> TITLES = Map.of(
            RecoveryActionType.NOTIFY_ASSIGNEE,    "Recovery action required",
            RecoveryActionType.REQUEST_EVIDENCE,   "Evidence required",
            RecoveryActionType.ASK_BLOCKER_UPDATE, "Blocker update required"
    );

    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService;

    @Override
    public Set<RecoveryActionType> supports() {
        return TITLES.keySet();
    }

    @Override
    public void execute(RecoveryPlanAction action, Task task, Project project) {
        String title = TITLES.get(action.getActionType());

        UserAccount recipient = null;
        if (action.getTargetUserId() != null) {
            recipient = userAccountRepository.findById(action.getTargetUserId()).orElse(null);
        }
        if (recipient == null) {
            recipient = task.getPrimaryAssignee();
        }

        if (recipient == null) {
            action.setStatus(RecoveryPlanActionStatus.FAILED);
            action.setExecutedAt(LocalDateTime.now());
            action.setResultMessage("No recipient found to notify");
            return;
        }

        String message = action.getMessage() != null ? action.getMessage() : "Please take action on your task.";
        notificationService.createAndPush(recipient, project, NotificationEntityType.TASK, task.getId(),
                NotificationType.SYSTEM, title, message);

        action.setStatus(RecoveryPlanActionStatus.EXECUTED);
        action.setExecutedAt(LocalDateTime.now());
        action.setResultMessage("Notification sent to " + recipient.getUsername());
    }
}
