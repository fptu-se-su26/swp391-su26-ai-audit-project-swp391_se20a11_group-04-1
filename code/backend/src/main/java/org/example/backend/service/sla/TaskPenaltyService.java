package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.repository.NotificationRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.TaskPenaltyLogRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.event.OutboxEventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskPenaltyService {

    private final TaskRepository taskRepository;
    private final TaskPenaltyLogRepository taskPenaltyLogRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationRepository notificationRepository;
    private final TaskSlaRuleService taskSlaRuleService;
    private final OutboxEventService outboxEventService;

    @Transactional
    public int applyOverduePenalties() {
        List<Task> tasks = taskRepository.findAllSlaCandidates();
        int changed = 0;
        for (Task task : tasks) {
            TaskSlaEvaluation evaluation = taskSlaRuleService.evaluate(task);
            if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY) && !task.isOverduePenaltyApplied()) {
                applyPenalty(task, evaluation);
                changed++;
            }
            if (evaluation.has(TaskSlaCategory.OVERDUE_FROZEN)) {
                escalateToLeaders(task, evaluation);
            }
        }
        log.info("Applied {} overdue penalties", changed);
        return changed;
    }

    private void applyPenalty(Task task, TaskSlaEvaluation evaluation) {
        task.setOverduePenaltyApplied(true);
        task.setOverduePenaltyAppliedAt(LocalDateTime.now());
        taskRepository.save(task);

        if (!taskPenaltyLogRepository.existsByTaskIdAndReason(task.getId(), "DEADLINE_OR_EVIDENCE_BREACH")) {
            taskPenaltyLogRepository.save(TaskPenaltyLog.builder()
                    .task(task)
                    .user(task.getPrimaryAssignee())
                    .reason("DEADLINE_OR_EVIDENCE_BREACH")
                    .build());
        }

        outboxEventService.createEvent("TASK_PENALTY_APPLIED", "Task", task.getId(), Map.of(
                "taskId", task.getId(),
                "assigneeId", task.getPrimaryAssignee().getId(),
                "overdueDays", evaluation.overdueDays(),
                "penaltyLabel", "OVERDUE_PENALTY"
        ));
    }

    private void escalateToLeaders(Task task, TaskSlaEvaluation evaluation) {
        List<ProjectMember> leaders = projectMemberRepository.findByProjectIdAndRoleName(task.getProject().getId(), "LEADER");
        for (ProjectMember leader : leaders) {
            Long leaderId = leader.getUser().getId();
            if (notificationRepository.existsByRecipientIdAndRelatedIdAndType(leaderId, task.getId(), NotificationType.SYSTEM)) {
                continue;
            }
            notificationRepository.save(Notification.builder()
                    .recipient(leader.getUser())
                    .title("Task overdue escalation")
                    .message("Task '" + task.getTitle() + "' is overdue for " + evaluation.overdueDays()
                            + " days and needs leader attention.")
                    .type(NotificationType.SYSTEM)
                    .relatedId(task.getId())
                    .build());
        }
    }
}
