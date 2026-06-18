package org.example.backend.service.sla.executor;

import org.example.backend.entity.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Các action cần thực hiện thủ công bởi leader — hệ thống chỉ đánh dấu SKIPPED.
 */
@Component
public class ManualActionExecutor implements RecoveryActionExecutor {

    @Override
    public Set<RecoveryActionType> supports() {
        return Set.of(
                RecoveryActionType.SCHEDULE_FOLLOW_UP,
                RecoveryActionType.SUGGEST_SPLIT_TASK,
                RecoveryActionType.SUGGEST_REASSIGN
        );
    }

    @Override
    public void execute(RecoveryPlanAction action, Task task, Project project) {
        action.setStatus(RecoveryPlanActionStatus.SKIPPED);
        action.setExecutedAt(LocalDateTime.now());
        action.setResultMessage("Manual action required: " + action.getActionType().name()
                + " is not executed automatically yet");
    }
}
