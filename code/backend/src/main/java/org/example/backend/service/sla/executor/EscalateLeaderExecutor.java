package org.example.backend.service.sla.executor;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.*;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.service.NotificationService;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class EscalateLeaderExecutor implements RecoveryActionExecutor {

    private static final List<String> LEADER_ROLES = Arrays.asList("LEADER", "PROJECT_LEADER", "MENTOR");
    private static final String ESCALATION_TITLE = "Escalation: Task at risk";

    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;

    @Override
    public Set<RecoveryActionType> supports() {
        return Set.of(RecoveryActionType.ESCALATE_LEADER);
    }

    @Override
    public void execute(RecoveryPlanAction action, Task task, Project project) {
        String message = action.getMessage() != null ? action.getMessage() : "Task requires leader attention.";
        List<ProjectMember> allMembers = projectMemberRepository.findByProjectId(project.getId());
        int notifiedCount = 0;
        int skippedCount = 0;

        for (ProjectMember pm : allMembers) {
            if (pm.getRole() == null || pm.getRole().getName() == null) continue;
            String roleName = pm.getRole().getName().trim().toUpperCase().replace(" ", "_");
            if (!LEADER_ROLES.contains(roleName)) continue;
            UserAccount leader = pm.getUser();
            if (leader == null) continue;

            if (notificationService.hasAlreadyNotified(
                    leader.getId(), task.getId(), NotificationType.SYSTEM, NotificationEntityType.TASK, ESCALATION_TITLE)) {
                skippedCount++;
                continue;
            }
            notificationService.createAndPush(leader, project, NotificationEntityType.TASK, task.getId(),
                    NotificationType.SYSTEM, ESCALATION_TITLE, message);
            notifiedCount++;
        }

        if (notifiedCount > 0) {
            String dupMsg = skippedCount > 0 ? " (" + skippedCount + " duplicate notifications skipped)" : "";
            action.setStatus(RecoveryPlanActionStatus.EXECUTED);
            action.setExecutedAt(LocalDateTime.now());
            action.setResultMessage("Escalated to " + notifiedCount + " leaders/mentors" + dupMsg);
        } else if (skippedCount > 0) {
            action.setStatus(RecoveryPlanActionStatus.SKIPPED);
            action.setExecutedAt(LocalDateTime.now());
            action.setResultMessage("Escalation already sent; skipped " + skippedCount + " duplicate notifications");
        } else {
            action.setStatus(RecoveryPlanActionStatus.FAILED);
            action.setExecutedAt(LocalDateTime.now());
            action.setResultMessage("No leaders or mentors found to escalate to");
        }
    }
}
