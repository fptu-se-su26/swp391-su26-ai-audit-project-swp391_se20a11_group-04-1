package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.TaskPenaltyLogRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.NotificationService;
import org.example.backend.service.event.OutboxEventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskPenaltyService {
    private static final String SLA_OVERDUE_TITLE = "SLA task quá hạn";

    private final TaskRepository taskRepository;
    private final TaskPenaltyLogRepository taskPenaltyLogRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final OutboxEventService outboxEventService;
    private final NotificationService notificationService;

    @Transactional
    public void applyPenaltyIfNeeded(Task task, TaskSlaEvaluation evaluation) {
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY) && !task.isOverduePenaltyApplied()) {
            applyPenalty(task, evaluation);
        }
    }

    @Transactional
    public void escalateToLeadersIfNeeded(Task task, TaskSlaEvaluation evaluation) {
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) {
            escalateToLeaders(task, evaluation);
        }
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

        Map<String, Object> penaltyPayload = new HashMap<>();
        penaltyPayload.put("taskId", task.getId());
        penaltyPayload.put("projectId", task.getProject().getId());
        if (task.getPrimaryAssignee() != null) {
            penaltyPayload.put("assigneeId", task.getPrimaryAssignee().getId());
        }
        penaltyPayload.put("overdueDays", evaluation.overdueDays());
        penaltyPayload.put("penaltyLabel", "OVERDUE_PENALTY");
        outboxEventService.createEvent("TASK_PENALTY_APPLIED", "Task", task.getId(), penaltyPayload);
    }

    private void escalateToLeaders(Task task, TaskSlaEvaluation evaluation) {
        List<ProjectMember> leaders = new java.util.ArrayList<>();
        leaders.addAll(projectMemberRepository.findByProjectIdAndRoleName(task.getProject().getId(), "LEADER"));
        leaders.addAll(projectMemberRepository.findByProjectIdAndRoleName(task.getProject().getId(), "PROJECT_LEADER"));
        leaders.addAll(projectMemberRepository.findByProjectIdAndRoleName(task.getProject().getId(), "MENTOR"));
        for (ProjectMember leader : leaders) {
            Long leaderId = leader.getUser().getId();
            if (notificationService.hasAlreadyNotified(
                    leaderId, task.getId(), NotificationType.SYSTEM, NotificationEntityType.TASK, SLA_OVERDUE_TITLE)) {
                continue;
            }
            notificationService.createAndPush(
                    leader.getUser(),
                    task.getProject(),
                    NotificationEntityType.TASK,
                    task.getId(),
                    NotificationType.SYSTEM,
                    SLA_OVERDUE_TITLE,
                    "Task '" + task.getTitle() + "' đã quá hạn " + evaluation.overdueDays()
                            + " ngày và cần Leader/Mentor xử lý."
            );
        }
    }
}
