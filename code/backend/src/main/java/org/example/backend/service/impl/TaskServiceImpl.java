// touched to trigger recompile
package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.*;
import org.example.backend.entity.*;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectCodeInsightSettingsRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.KanbanColumnRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskReviewDecisionRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.repository.BugReportRepository;
import org.example.backend.service.github.GitHubApiService;
import org.example.backend.repository.EvidenceRepository;
import org.example.backend.repository.EvidenceLinkRepository;
import org.example.backend.service.NotificationService;
import org.example.backend.service.TaskService;
import org.example.backend.service.TaskReviewSnapshotService;
import org.example.backend.service.CodeInsightScoringService;
import org.example.backend.service.CodeInsightApprovalGateService;
import org.example.backend.repository.mongo.TaskCommentRepository;
import org.example.backend.repository.mongo.TaskProposalRepository;
import org.example.backend.entity.TaskComment;
import org.example.backend.entity.TaskProposal;
import org.example.backend.service.event.OutboxEventService;
import org.example.backend.service.sla.TaskSlaRuleService;
import org.example.backend.service.sla.TaskSlaPauseService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.example.backend.dto.event.SyncEvent;
import org.example.backend.constant.SyncTriggerType;
import java.util.Map;

import java.util.HashMap;
import java.util.Objects;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Optional;
import java.math.BigDecimal;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserAccountRepository userAccountRepository;
    private final RequirementRepository requirementRepository;
    private final org.example.backend.repository.UseCaseRepository useCaseRepository;
    private final SprintRepository sprintRepository;
    private final BugReportRepository bugReportRepository;
    private final GitHubApiService gitHubApiService;
    private final KanbanColumnRepository kanbanColumnRepository;
    private final KanbanColumnServiceImpl kanbanColumnService;
    private final EvidenceRepository evidenceRepository;
    private final EvidenceLinkRepository evidenceLinkRepository;
    private final TaskReviewDecisionRepository taskReviewDecisionRepository;
    private final ProjectCodeInsightSettingsRepository codeInsightSettingsRepository;
    private final TaskReviewSnapshotService TaskReviewSnapshotService;
    private final CodeInsightScoringService codeInsightScoringService;
    private final CodeInsightApprovalGateService codeInsightApprovalGateService;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskProposalRepository taskProposalRepository;
    private final TaskSlaRuleService taskSlaRuleService;
    private final TaskSlaPauseService taskSlaPauseService;
    private final NotificationService notificationService;
    private final OutboxEventService outboxEventService;
    private final org.example.backend.config.NotificationWebSocketHandler notificationWebSocketHandler;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public List<TaskResponse> getProjectTasks(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);
        kanbanColumnService.ensureDefaultColumns(projectId);
        return toResponses(taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getHotTasks(Long projectId, Long userId, int limit) {
        ensureProjectMember(projectId, userId);

        List<Task> tasks = taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId);
        if (tasks.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> taskIds = tasks.stream().map(Task::getId).collect(Collectors.toList());
        List<TaskComment> comments = taskCommentRepository.findByTaskIdIn(taskIds);
        List<TaskProposal> proposals = taskProposalRepository.findByTaskIdIn(taskIds);

        Map<Long, List<TaskComment>> commentsByTaskId = comments.stream()
                .collect(Collectors.groupingBy(TaskComment::getTaskId));

        Map<Long, List<TaskProposal>> proposalsByTaskId = proposals.stream()
                .collect(Collectors.groupingBy(TaskProposal::getTaskId));

        Map<Task, Integer> scores = new LinkedHashMap<>();
        for (Task task : tasks) {
            int score = 0;

            List<TaskComment> taskComments = commentsByTaskId.getOrDefault(task.getId(), Collections.emptyList());
            for (TaskComment c : taskComments) {
                score += 3;
                score += (c.getVotes() != null ? c.getVotes().size() : 0) * 1;
            }

            List<TaskProposal> taskProposals = proposalsByTaskId.getOrDefault(task.getId(), Collections.emptyList());
            for (TaskProposal p : taskProposals) {
                score += 5;
                score += (p.getVotes() != null ? p.getVotes().size() : 0) * 2;
                score += (p.getComments() != null ? p.getComments().size() : 0) * 4;
            }

            scores.put(task, score);
        }

        return scores.entrySet().stream()
                .sorted((entry1, entry2) -> entry2.getValue().compareTo(entry1.getValue()))
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.collectingAndThen(Collectors.toList(), this::toResponses));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(Long userId) {
        return taskRepository.findByPrimaryAssigneeIdOrderByUpdatedAtDesc(userId).stream()
                .filter(task -> projectMemberRepository.findByProjectIdAndUserId(task.getProject().getId(), userId).isPresent())
                .collect(Collectors.collectingAndThen(Collectors.toList(), this::toResponses));
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTask(Long taskId, Long userId) {
        Task task = findTask(taskId);
        ensureProjectMember(task.getProject().getId(), userId);
        return toResponse(task);
    }

    @Override
    @org.example.backend.annotation.Auditable(action="CREATE_TASK", entityType="Task")
    public TaskResponse createTask(Long projectId, TaskRequest request, Long userId) {
        ensureProjectMember(projectId, userId);
        // Pessimistic write lock to prevent concurrent projectSubId collision
        Project project = projectRepository.findByIdWithPessimisticWrite(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
        UserAccount creator = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        int nextSubId = taskRepository.findMaxProjectSubIdByProjectId(projectId) + 1;
        String tCode = String.format("TSK-%03d", nextSubId);

        Task task = Task.builder()
                .project(project)
                .createdBy(creator)
                .title(requiredText(request.getTitle(), "Task title is required"))
                .type(parseEnum(request.getType(), TaskType.class, TaskType.DEVELOPMENT))
                .priority(parseEnum(request.getPriority(), Priority.class, Priority.MEDIUM))
                .startDate(request.getStartDate() != null ? request.getStartDate() : java.time.LocalDate.now())
                .weight(request.getWeight() != null ? validateWeight(request.getWeight()) : BigDecimal.ONE)
                .status(parseEnum(request.getStatus(), TaskStatus.class, TaskStatus.TODO))
                .projectSubId(nextSubId)
                .taskCode(tCode)
                .checklist(new ArrayList<>())
                .build();

        applyRequest(task, request, projectId, userId);
        if (task.getKanbanColumn() == null) {
            setColumnFromStatus(task, projectId, task.getStatus());
        }
        Task savedTask = taskRepository.save(task);
        if (savedTask.getRequirementId() != null) {
            syncRequirementStatus(savedTask.getRequirementId());
        }
        if (savedTask.getUseCaseId() != null) {
            syncUseCaseStatus(savedTask.getUseCaseId());
        }

        HashMap<String, Object> payload = new HashMap<>();
        payload.put("taskId", savedTask.getId());
        payload.put("projectId", savedTask.getProject().getId());
        payload.put("sprintId", savedTask.getSprintId());
        payload.put("assigneeId", savedTask.getPrimaryAssignee() != null ? savedTask.getPrimaryAssignee().getId() : null);
        payload.put("deadline", savedTask.getDeadline() != null ? savedTask.getDeadline().toString() : null);
        payload.put("occurredAt", LocalDateTime.now().toString());

        outboxEventService.createEvent("TASK_CREATED", "Task", savedTask.getId(), payload);

        // Outbound sync: create GitHub Issue for non-BUG_FIX tasks (non-blocking)
        // Except for DEVELOPMENT parent tasks, which wait for leader approval & sync
        boolean isDevParent = savedTask.getType() == TaskType.DEVELOPMENT && savedTask.getParent() == null;
        if (!isDevParent && (savedTask.getType() != TaskType.BUG_FIX || savedTask.getParent() != null)) {
            try {
                gitHubApiService.createGitHubIssueForTask(savedTask, userId);
            } catch (Exception e) {
                log.warn("Non-blocking GitHub sync failed for Task ID: {}: {}", savedTask.getId(), e.getMessage());
            }
        }

        return toResponse(savedTask);
    }

    @Override
    @org.example.backend.annotation.Auditable(action="UPDATE_TASK", entityType="Task", entityIdArgIndex=0)
    public TaskResponse updateTask(Long taskId, TaskRequest request, Long userId) {
        Task task = findTask(taskId);
        ensureProjectMember(task.getProject().getId(), userId);
        LocalDate oldDeadline = task.getDeadline();
        Long oldSprintId = task.getSprintId();
        Long oldAssigneeId = task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null;
        TaskStatus oldStatus = task.getStatus();
        Long oldReqId = task.getRequirementId();
        Long oldUcId = task.getUseCaseId();

        applyRequest(task, request, task.getProject().getId(), userId);
        Task savedTask = taskRepository.save(task);

        if (oldReqId != null && !oldReqId.equals(savedTask.getRequirementId())) {
            syncRequirementStatus(oldReqId);
        }
        if (savedTask.getRequirementId() != null) {
            syncRequirementStatus(savedTask.getRequirementId());
        }
        if (oldUcId != null && !oldUcId.equals(savedTask.getUseCaseId())) {
            syncUseCaseStatus(oldUcId);
        }
        if (savedTask.getUseCaseId() != null) {
            syncUseCaseStatus(savedTask.getUseCaseId());
        }

        HashMap<String, Object> payload = new HashMap<>();
        payload.put("taskId", savedTask.getId());
        payload.put("projectId", savedTask.getProject().getId());
        payload.put("sprintId", savedTask.getSprintId());
        payload.put("assigneeId", savedTask.getPrimaryAssignee() != null ? savedTask.getPrimaryAssignee().getId() : null);
        payload.put("deadline", savedTask.getDeadline() != null ? savedTask.getDeadline().toString() : null);
        payload.put("occurredAt", LocalDateTime.now().toString());

        outboxEventService.createEvent("TASK_UPDATED", "Task", savedTask.getId(), payload);

        TaskStatus newStatus = savedTask.getStatus();
        if (!Objects.equals(oldStatus, newStatus)) {
            HashMap<String, Object> statusPayload = new HashMap<>(payload);
            statusPayload.put("oldStatus", oldStatus != null ? oldStatus.name() : null);
            statusPayload.put("newStatus", newStatus != null ? newStatus.name() : null);
            outboxEventService.createEvent("TASK_STATUS_CHANGED", "Task", savedTask.getId(), statusPayload);
        }

        LocalDate newDeadline = savedTask.getDeadline();
        Long newSprintId = savedTask.getSprintId();
        Long newAssigneeId = savedTask.getPrimaryAssignee() != null ? savedTask.getPrimaryAssignee().getId() : null;

        if (!Objects.equals(oldDeadline, newDeadline)) {
            HashMap<String, Object> deadlinePayload = new HashMap<>(payload);
            deadlinePayload.put("oldDeadline", oldDeadline != null ? oldDeadline.toString() : null);
            deadlinePayload.put("newDeadline", newDeadline != null ? newDeadline.toString() : null);
            outboxEventService.createEvent("TASK_DEADLINE_UPDATED", "Task", savedTask.getId(), deadlinePayload);
        }

        if (!Objects.equals(oldSprintId, newSprintId)) {
            HashMap<String, Object> sprintPayload = new HashMap<>(payload);
            sprintPayload.put("oldSprintId", oldSprintId);
            sprintPayload.put("newSprintId", newSprintId);
            outboxEventService.createEvent("TASK_SPRINT_CHANGED", "Task", savedTask.getId(), sprintPayload);
        }

        if (!Objects.equals(oldAssigneeId, newAssigneeId)) {
            HashMap<String, Object> assigneePayload = new HashMap<>(payload);
            assigneePayload.put("oldAssigneeId", oldAssigneeId);
            assigneePayload.put("newAssigneeId", newAssigneeId);
            outboxEventService.createEvent("TASK_ASSIGNEE_CHANGED", "Task", savedTask.getId(), assigneePayload);
        }
        syncWithBugReport(savedTask, userId);
        if (savedTask.getParent() != null) {
            syncParentAssignee(savedTask, userId);
            checkAndCompleteParentTask(savedTask.getParent());
        }
        // Sync GitHub issue state for non-BUG_FIX tasks (non-blocking)
        boolean isDevParentPending = savedTask.getType() == TaskType.DEVELOPMENT && savedTask.getParent() == null && savedTask.getGithubIssueNumber() == null;
        boolean isBlankDraftPending = savedTask.getDescription() != null 
                && (savedTask.getDescription().contains("github-blank-draft") || savedTask.getDescription().contains("feature-proposal-draft")) 
                && savedTask.getGithubIssueNumber() == null;

        if (!isDevParentPending && !isBlankDraftPending && (savedTask.getType() != TaskType.BUG_FIX || savedTask.getParent() != null)) {
            try {
                gitHubApiService.updateGitHubIssueStatusForTask(savedTask, userId);
            } catch (Exception e) {
                log.warn("Non-blocking GitHub status sync failed for Task ID: {}: {}", savedTask.getId(), e.getMessage());
            }
        }
        return toResponse(savedTask);
    }

    @Override
    public TaskResponse updateTaskStatus(Long taskId, TaskStatusUpdateRequest request, Long userId) {
        Task task = findTask(taskId);
        Long projectId = task.getProject().getId();
        ensureProjectMember(projectId, userId);
        if (task.getProject().getStatus() == org.example.backend.entity.ProjectStatus.COMPLETED
                || task.getProject().getStatus() == org.example.backend.entity.ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Project is closed, cannot edit the task.");
        }
        TaskStatus oldStatus = task.getStatus();
        TaskStatus nextStatus = null;
        if (request.getColumnId() != null) {
            KanbanColumn targetColumn = kanbanColumnRepository.findById(request.getColumnId())
                    .orElseThrow(() -> new BadRequestException("Kanban column not found"));
            if (targetColumn.getStatusKey() != null) {
                nextStatus = parseEnum(targetColumn.getStatusKey(), TaskStatus.class, task.getStatus());
            }
        } else if (request.getStatus() != null) {
            nextStatus = parseEnum(request.getStatus(), TaskStatus.class, task.getStatus());
        }

        if (!isProjectLeader(projectId, userId)) {
            Long assigneeId = task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null;
            if (assigneeId == null || !assigneeId.equals(userId)) {
                throw new BadRequestException("You do not have permission to drag-and-drop or change the status of another user's task.");
            }
        }

        if (nextStatus != null) {
            validateStatusTransition(task, nextStatus);
            ensureRegularStatusUpdateAllowed(task, nextStatus, userId);
        }

        if (request.getBlockedReason() != null) {
            task.setBlockedReason(request.getBlockedReason().trim());
        } else if (nextStatus != null && oldStatus == TaskStatus.BLOCKED && nextStatus != TaskStatus.BLOCKED) {
            task.setBlockedReason(null);
        }

        if (request.getColumnId() != null) {
            if (isTightlyBoundToIssue(task)) {
                if (!isProjectLeader(projectId, userId)) {
                    throw new BadRequestException("Only Project Leaders are allowed to drag-and-drop tasks linked to GitHub issues on the Kanban board.");
                }
            }
            setColumn(task, request.getColumnId(), projectId, userId);
        } else if (request.getStatus() != null) {
            changeTaskStatus(task, nextStatus, userId);
        }
        Task savedTask = taskRepository.save(task);

        if (!Objects.equals(oldStatus, savedTask.getStatus())) {
            HashMap<String, Object> payload = new HashMap<>();
            payload.put("taskId", savedTask.getId());
            payload.put("projectId", savedTask.getProject().getId());
            payload.put("sprintId", savedTask.getSprintId());
            payload.put("assigneeId", savedTask.getPrimaryAssignee() != null ? savedTask.getPrimaryAssignee().getId() : null);
            payload.put("deadline", savedTask.getDeadline() != null ? savedTask.getDeadline().toString() : null);
            payload.put("oldStatus", oldStatus != null ? oldStatus.name() : null);
            payload.put("newStatus", savedTask.getStatus() != null ? savedTask.getStatus().name() : null);
            payload.put("occurredAt", LocalDateTime.now().toString());

            outboxEventService.createEvent("TASK_STATUS_CHANGED", "Task", savedTask.getId(), payload);
        }

        if (savedTask.getRequirementId() != null) {
            syncRequirementStatus(savedTask.getRequirementId());
        }
        if (savedTask.getUseCaseId() != null) {
            syncUseCaseStatus(savedTask.getUseCaseId());
        }
        syncWithBugReport(savedTask, userId);
        if (savedTask.getParent() != null) {
            checkAndCompleteParentTask(savedTask.getParent());
        }
        // Sync GitHub issue state for non-BUG_FIX tasks (non-blocking)
        boolean isDevParentPending = savedTask.getType() == TaskType.DEVELOPMENT && savedTask.getParent() == null && savedTask.getGithubIssueNumber() == null;
        boolean isBlankDraftPending = savedTask.getDescription() != null 
                && (savedTask.getDescription().contains("github-blank-draft") || savedTask.getDescription().contains("feature-proposal-draft")) 
                && savedTask.getGithubIssueNumber() == null;

        if (!isDevParentPending && !isBlankDraftPending && (savedTask.getType() != TaskType.BUG_FIX || savedTask.getParent() != null)) {
            try {
                gitHubApiService.updateGitHubIssueStatusForTask(savedTask, userId);
            } catch (Exception e) {
                log.warn("Non-blocking GitHub status sync failed for Task ID: {}: {}", savedTask.getId(), e.getMessage());
            }
        }
        return toResponse(savedTask);
    }

    @Override
    public TaskResponse updateTaskAssignee(Long taskId, TaskAssigneeUpdateRequest request, Long userId) {
        Task task = findTask(taskId);
        Long projectId = task.getProject().getId();
        ensureProjectMember(projectId, userId);
        Long oldAssigneeId = task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null;
        TaskStatus oldStatus = task.getStatus();
        setAssignee(task, request.getAssigneeId(), projectId, userId);
        Task savedTask = taskRepository.save(task);

        Long newAssigneeId = savedTask.getPrimaryAssignee() != null ? savedTask.getPrimaryAssignee().getId() : null;
        if (!Objects.equals(oldAssigneeId, newAssigneeId)) {
            HashMap<String, Object> payload = new HashMap<>();
            payload.put("taskId", savedTask.getId());
            payload.put("projectId", savedTask.getProject().getId());
            payload.put("sprintId", savedTask.getSprintId());
            payload.put("assigneeId", newAssigneeId);
            payload.put("deadline", savedTask.getDeadline() != null ? savedTask.getDeadline().toString() : null);
            payload.put("oldAssigneeId", oldAssigneeId);
            payload.put("newAssigneeId", newAssigneeId);
            payload.put("occurredAt", LocalDateTime.now().toString());

            outboxEventService.createEvent("TASK_ASSIGNEE_CHANGED", "Task", savedTask.getId(), payload);
        }

        TaskStatus newStatus = savedTask.getStatus();
        if (!Objects.equals(oldStatus, newStatus)) {
            HashMap<String, Object> statusPayload = new HashMap<>();
            statusPayload.put("taskId", savedTask.getId());
            statusPayload.put("projectId", savedTask.getProject().getId());
            statusPayload.put("sprintId", savedTask.getSprintId());
            statusPayload.put("assigneeId", newAssigneeId);
            statusPayload.put("deadline", savedTask.getDeadline() != null ? savedTask.getDeadline().toString() : null);
            statusPayload.put("oldStatus", oldStatus != null ? oldStatus.name() : null);
            statusPayload.put("newStatus", newStatus != null ? newStatus.name() : null);
            statusPayload.put("occurredAt", LocalDateTime.now().toString());

            outboxEventService.createEvent("TASK_STATUS_CHANGED", "Task", savedTask.getId(), statusPayload);
        }

        syncWithBugReport(savedTask, userId);
        if (savedTask.getParent() != null) {
            syncParentAssignee(savedTask, userId);
        }
        return toResponse(savedTask);
    }


    @Override
    public TaskResponse requestTaskReview(Long taskId, TaskReviewRequest request, Long userId) {
        // Member starts the Code Insight gate: task is moved to IN_REVIEW and no longer counts as completed.
        Task task = findTask(taskId);
        ensureProjectMember(task.getProject().getId(), userId);
        if (task.getStatus() == TaskStatus.DONE) {
            throw new BadRequestException("Done task cannot be requested for review");
        }
        if (task.getStatus() == TaskStatus.IN_REVIEW) {
            throw new BadRequestException("Task is already in review");
        }
        ensureAcceptedEvidenceBeforeReview(task);

        TaskStatus fromStatus = task.getStatus();
        task.setStatus(TaskStatus.IN_REVIEW);
        task.setCompletedAt(null);
        setColumnFromStatus(task, task.getProject().getId(), TaskStatus.IN_REVIEW);
        syncSlaPauseForStatusChange(task, fromStatus, TaskStatus.IN_REVIEW);
        Task savedTask = taskRepository.save(task);
        syncWithBugReport(savedTask, userId);
        syncGitHubIssueStatus(savedTask, userId);
        recordReviewDecision(savedTask, userId, TaskReviewDecisionType.REQUEST_REVIEW, fromStatus, TaskStatus.IN_REVIEW,
                request != null ? request.getReason() : null);

        if (!Objects.equals(fromStatus, TaskStatus.IN_REVIEW)) {
            HashMap<String, Object> payload = new HashMap<>();
            payload.put("taskId", savedTask.getId());
            payload.put("projectId", savedTask.getProject().getId());
            payload.put("sprintId", savedTask.getSprintId());
            payload.put("assigneeId", savedTask.getPrimaryAssignee() != null ? savedTask.getPrimaryAssignee().getId() : null);
            payload.put("deadline", savedTask.getDeadline() != null ? savedTask.getDeadline().toString() : null);
            payload.put("oldStatus", fromStatus != null ? fromStatus.name() : null);
            payload.put("newStatus", TaskStatus.IN_REVIEW.name());
            payload.put("occurredAt", LocalDateTime.now().toString());

            outboxEventService.createEvent("TASK_STATUS_CHANGED", "Task", savedTask.getId(), payload);
        }

        return toResponse(savedTask);
    }

    @Override
    public TaskResponse approveTaskReview(Long taskId, TaskReviewRequest request, Long userId) {
        // Leader approval is the official path from IN_REVIEW to DONE.
        Task task = findTask(taskId);
        ensureProjectLeader(task.getProject().getId(), userId);
        if (task.getStatus() != TaskStatus.IN_REVIEW) {
            throw new BadRequestException("Only tasks in review can be approved");
        }
        codeInsightApprovalGateService.assertCanApprove(task);

        Long reviewSnapshotId = TaskReviewSnapshotService.createSnapshot(task, userId);
        TaskStatus fromStatus = task.getStatus();
        task.setStatus(TaskStatus.DONE);
        if (task.getCompletedAt() == null) {
            task.setCompletedAt(LocalDateTime.now());
        }
        setColumnFromStatus(task, task.getProject().getId(), TaskStatus.DONE);
        syncSlaPauseForStatusChange(task, fromStatus, TaskStatus.DONE);
        Task savedTask = taskRepository.save(task);
        syncWithBugReport(savedTask, userId);
        if (savedTask.getParent() != null) {
            checkAndCompleteParentTask(savedTask.getParent());
        }
        syncGitHubIssueStatus(savedTask, userId);
        recordReviewDecision(savedTask, userId, TaskReviewDecisionType.APPROVED, fromStatus, TaskStatus.DONE,
                reviewSnapshotId,
                request != null ? request.getReason() : null);

        if (!Objects.equals(fromStatus, TaskStatus.DONE)) {
            HashMap<String, Object> payload = new HashMap<>();
            payload.put("taskId", savedTask.getId());
            payload.put("projectId", savedTask.getProject().getId());
            payload.put("sprintId", savedTask.getSprintId());
            payload.put("assigneeId", savedTask.getPrimaryAssignee() != null ? savedTask.getPrimaryAssignee().getId() : null);
            payload.put("deadline", savedTask.getDeadline() != null ? savedTask.getDeadline().toString() : null);
            payload.put("oldStatus", fromStatus != null ? fromStatus.name() : null);
            payload.put("newStatus", TaskStatus.DONE.name());
            payload.put("occurredAt", LocalDateTime.now().toString());

            outboxEventService.createEvent("TASK_STATUS_CHANGED", "Task", savedTask.getId(), payload);
        }

        return toResponse(savedTask);
    }

    @Override
    public TaskResponse rejectTaskReview(Long taskId, TaskReviewRequest request, Long userId) {
        // Leader rejection returns the task to work, keeping the reason as review feedback.
        Task task = findTask(taskId);
        ensureProjectLeader(task.getProject().getId(), userId);
        if (task.getStatus() != TaskStatus.IN_REVIEW) {
            throw new BadRequestException("Only tasks in review can be rejected");
        }

        String reason = requiredText(request != null ? request.getReason() : null, "Reject reason is required");
        TaskStatus targetStatus = parseEnum(request != null ? request.getTargetStatus() : null, TaskStatus.class, TaskStatus.NEEDS_CHANGES);
        if (targetStatus != TaskStatus.NEEDS_CHANGES && targetStatus != TaskStatus.BLOCKED) {
            throw new BadRequestException("Rejected task must return to NEEDS_CHANGES or BLOCKED");
        }

        Long reviewSnapshotId = TaskReviewSnapshotService.createSnapshot(task, userId);
        TaskStatus fromStatus = task.getStatus();
        task.setStatus(targetStatus);
        task.setCompletedAt(null);
        if (targetStatus == TaskStatus.BLOCKED) {
            task.setBlockedReason(reason);
        } else {
            task.setBlockedReason(null);
        }
        setColumnFromStatus(task, task.getProject().getId(), targetStatus);
        syncSlaPauseForStatusChange(task, fromStatus, targetStatus);
        Task savedTask = taskRepository.save(task);
        syncWithBugReport(savedTask, userId);
        syncGitHubIssueStatus(savedTask, userId);
        recordReviewDecision(savedTask, userId, TaskReviewDecisionType.REJECTED, fromStatus, targetStatus, reviewSnapshotId, reason);

        if (!Objects.equals(fromStatus, targetStatus)) {
            HashMap<String, Object> payload = new HashMap<>();
            payload.put("taskId", savedTask.getId());
            payload.put("projectId", savedTask.getProject().getId());
            payload.put("sprintId", savedTask.getSprintId());
            payload.put("assigneeId", savedTask.getPrimaryAssignee() != null ? savedTask.getPrimaryAssignee().getId() : null);
            payload.put("deadline", savedTask.getDeadline() != null ? savedTask.getDeadline().toString() : null);
            payload.put("oldStatus", fromStatus != null ? fromStatus.name() : null);
            payload.put("newStatus", targetStatus.name());
            payload.put("occurredAt", LocalDateTime.now().toString());

            outboxEventService.createEvent("TASK_STATUS_CHANGED", "Task", savedTask.getId(), payload);
        }

        return toResponse(savedTask);
    }

    @Override
    public TaskResponse reopenTaskReview(Long taskId, TaskReviewRequest request, Long userId) {
        Task task = findTask(taskId);
        ensureProjectLeader(task.getProject().getId(), userId);
        if (task.getStatus() != TaskStatus.DONE) {
            throw new BadRequestException("Only done tasks can be reopened for review");
        }
        String reason = requiredText(request != null ? request.getReason() : null, "Reopen reason is required");
        Long reviewSnapshotId = TaskReviewSnapshotService.createSnapshot(task, userId);
        TaskStatus fromStatus = task.getStatus();
        task.setStatus(TaskStatus.IN_REVIEW);
        task.setCompletedAt(null);
        task.setBlockedReason(null);
        setColumnFromStatus(task, task.getProject().getId(), TaskStatus.IN_REVIEW);
        Task savedTask = taskRepository.save(task);
        syncWithBugReport(savedTask, userId);
        syncGitHubIssueStatus(savedTask, userId);
        recordReviewDecision(savedTask, userId, TaskReviewDecisionType.REOPENED_REVIEW, fromStatus, TaskStatus.IN_REVIEW, reviewSnapshotId, reason);
        notifyAssignee(savedTask, "Task reopened for review", reason);
        return toResponse(savedTask);
    }

    @Override
    public TaskResponse requestTaskRework(Long taskId, TaskReviewRequest request, Long userId) {
        Task task = findTask(taskId);
        ensureProjectLeader(task.getProject().getId(), userId);
        if (task.getStatus() != TaskStatus.DONE) {
            throw new BadRequestException("Only done tasks can be sent back for rework");
        }
        String reason = requiredText(request != null ? request.getReason() : null, "Rework reason is required");
        Long reviewSnapshotId = TaskReviewSnapshotService.createSnapshot(task, userId);
        TaskStatus fromStatus = task.getStatus();
        task.setStatus(TaskStatus.NEEDS_CHANGES);
        task.setCompletedAt(null);
        task.setBlockedReason(null);
        setColumnFromStatus(task, task.getProject().getId(), TaskStatus.NEEDS_CHANGES);
        Task savedTask = taskRepository.save(task);
        syncWithBugReport(savedTask, userId);
        syncGitHubIssueStatus(savedTask, userId);
        recordReviewDecision(savedTask, userId, TaskReviewDecisionType.REQUESTED_REWORK, fromStatus, TaskStatus.NEEDS_CHANGES, reviewSnapshotId, reason);
        notifyAssignee(savedTask, "Task needs changes", reason);
        return toResponse(savedTask);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskReviewDecisionResponse> getProjectReviewQueue(Long projectId, Long userId) {
        // Queue is built from live IN_REVIEW tasks, then decorated with the latest review decision if available.
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));
        
        boolean isMemberRole = member.getRole() != null && "MEMBER".equalsIgnoreCase(member.getRole().getName());
        
        return taskRepository.findByProjectIdAndStatusOrderByUpdatedAtDesc(projectId, TaskStatus.IN_REVIEW).stream()
                .filter(task -> !isMemberRole || (task.getPrimaryAssignee() != null && task.getPrimaryAssignee().getId().equals(userId)))
                .map(task -> taskReviewDecisionRepository.findTopByTaskIdOrderByCreatedAtDesc(task.getId())
                        .map(this::toReviewDecisionResponse)
                        .orElseGet(() -> toSyntheticReviewQueueItem(task)))
                .collect(Collectors.toList());
    }

    private void syncWithBugReport(Task task, Long userId) {
        if (task.getType() == TaskType.BUG_FIX) {
            bugReportRepository.findByRelatedTaskId(task.getId()).ifPresent(bug -> {
                // Synchronize Status
                if (task.getStatus() == TaskStatus.DONE) {
                    bug.setStatus(BugStatus.FIXED);
                } else if (task.getStatus() == TaskStatus.IN_PROGRESS || task.getStatus() == TaskStatus.NEEDS_CHANGES) {
                    bug.setStatus(BugStatus.IN_PROGRESS);
                } else if (task.getStatus() == TaskStatus.IN_REVIEW) {
                    bug.setStatus(BugStatus.VERIFIED);
                } else if (task.getStatus() == TaskStatus.TODO) {
                    if (bug.getStatus() != BugStatus.DRAFT) {
                        bug.setStatus(BugStatus.OPEN);
                    }
                }

                // Synchronize Assignee
                bug.setAssignedTo(task.getPrimaryAssignee());

                bugReportRepository.save(bug);

                // Trigger outbound GitHub Issue status sync non-blocking
                try {
                    gitHubApiService.updateGitHubIssueStatus(bug, userId);
                } catch (Exception e) {
                    // Non-blocking log
                }
            });
        }
    }

    private void syncParentAssignee(Task savedTask, Long userId) {
        if (savedTask == null || savedTask.getParent() == null) return;

        Task parent = savedTask.getParent();
        List<Task> subTasks = taskRepository.findByParentId(parent.getId());

        boolean allSameOrOnlyOne = false;
        if (subTasks.size() <= 1) {
            allSameOrOnlyOne = true;
        } else {
            Long firstAssigneeId = subTasks.get(0).getPrimaryAssignee() != null ? subTasks.get(0).getPrimaryAssignee().getId() : null;
            boolean match = true;
            for (Task sub : subTasks) {
                Long subAssigneeId = sub.getPrimaryAssignee() != null ? sub.getPrimaryAssignee().getId() : null;
                if (subAssigneeId == null || !subAssigneeId.equals(firstAssigneeId)) {
                    match = false;
                    break;
                }
            }
            if (match) {
                allSameOrOnlyOne = true;
            }
        }

        if (allSameOrOnlyOne) {
            parent.setPrimaryAssignee(savedTask.getPrimaryAssignee());
            if (savedTask.getPrimaryAssignee() != null) {
                if (parent.getAssignees() == null) {
                    parent.setAssignees(new java.util.HashSet<>());
                }
                parent.getAssignees().clear();
                parent.getAssignees().add(savedTask.getPrimaryAssignee());
            } else {
                if (parent.getAssignees() != null) {
                    parent.getAssignees().clear();
                }
            }
            taskRepository.save(parent);
            syncWithBugReport(parent, userId);
        }
    }

    @Override
    @org.example.backend.annotation.Auditable(action="DELETE_TASK", entityType="Task", entityIdArgIndex=0)
    public TaskResponse deleteTask(Long taskId, Long userId) {
        Task task = findTask(taskId);
        ensureProjectMember(task.getProject().getId(), userId);
        Long reqId = task.getRequirementId();
        Long ucId = task.getUseCaseId();
        taskRepository.delete(task);
        taskRepository.flush();
        if (reqId != null) {
            syncRequirementStatus(reqId);
        }
        if (ucId != null) {
            syncUseCaseStatus(ucId);
        }
        return toResponse(task);
    }

    // =========================================================================
    // DAILY VIEW
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public DailyViewResponse getDailyView(Long projectId, Long userId, LocalDate date) {
        ensureProjectMember(projectId, userId);
        boolean isLeader = isProjectLeader(projectId, userId);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay   = date.plusDays(1).atStartOfDay();

        // 1. Lấy task theo từng loại
        List<Task> overdue  = taskRepository.findOverdueTasks(projectId, date);
        List<Task> blocked  = taskRepository.findBlockedTasks(projectId, date);
        List<Task> due      = taskRepository.findDueTasks(projectId, date);
        List<Task> ongoing  = taskRepository.findOngoingTasks(projectId, date);
        List<Task> done     = taskRepository.findDoneTasksOnDate(projectId, startOfDay, endOfDay);
        
        if (!isLeader) {
            overdue.removeIf(t -> t.getPrimaryAssignee() == null || !t.getPrimaryAssignee().getId().equals(userId));
            blocked.removeIf(t -> t.getPrimaryAssignee() == null || !t.getPrimaryAssignee().getId().equals(userId));
            due.removeIf(t -> t.getPrimaryAssignee() == null || !t.getPrimaryAssignee().getId().equals(userId));
            ongoing.removeIf(t -> t.getPrimaryAssignee() == null || !t.getPrimaryAssignee().getId().equals(userId));
            done.removeIf(t -> t.getPrimaryAssignee() == null || !t.getPrimaryAssignee().getId().equals(userId));
        }
        
        int inProgressCount = taskRepository.countInProgressTasks(projectId);

        // Gộp overdue + blocked (tránh trùng)
        List<Task> overdueAndBlocked = new ArrayList<>(overdue);
        blocked.stream()
                .filter(b -> overdueAndBlocked.stream().noneMatch(o -> o.getId().equals(b.getId())))
                .forEach(overdueAndBlocked::add);

        // Sort by priority (CRITICAL -> LOW)
        java.util.Comparator<Task> prioritySorter = java.util.Comparator.comparing(Task::getPriority, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder()));
        overdueAndBlocked.sort(prioritySorter);
        due.sort(prioritySorter);
        ongoing.sort(prioritySorter);
        done.sort(prioritySorter);

        // 2. Stats
        int totalToday = overdueAndBlocked.size() + due.size() + ongoing.size() + done.size();
        int progressPercent = totalToday > 0
                ? (int) Math.round((done.size() * 100.0) / totalToday)
                : 0;

        DailyViewResponse.DailyStats stats = DailyViewResponse.DailyStats.builder()
                .overdueCount(overdueAndBlocked.size())
                .dueCount(due.size())
                .ongoingCount(ongoing.size())
                .inProgressCount(inProgressCount)
                .doneCount(done.size())
                .totalToday(totalToday)
                .progressPercent(progressPercent)
                .build();

        // 3. Member progress (chỉ tính khối lượng công việc của ngày hôm nay)
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        if (!isLeader) {
            members = members.stream().filter(m -> m.getUser().getId().equals(userId)).collect(Collectors.toList());
        }
        List<Task> dailyTasks = new ArrayList<>();
        dailyTasks.addAll(overdueAndBlocked);
        dailyTasks.addAll(due);
        dailyTasks.addAll(ongoing);
        dailyTasks.addAll(done);
        // Loại bỏ trùng lặp nếu có
        List<Task> uniqueDailyTasks = dailyTasks.stream().distinct().toList();
        List<MemberProgressResponse> memberProgress = buildMemberProgress(members, uniqueDailyTasks, date);

        // 4. AI Insight
        AiInsightResponse aiInsight = buildDailyAiInsight(overdueAndBlocked, blocked, members);

        return DailyViewResponse.builder()
                .date(date)
                .overdueTasks(overdueAndBlocked.stream().map(t -> toCalendarItem(t, date)).toList())
                .dueTasks(due.stream().map(t -> toCalendarItem(t, date)).toList())
                .ongoingTasks(ongoing.stream().map(t -> toCalendarItem(t, date)).toList())
                .doneTasks(done.stream().map(t -> toCalendarItem(t, date)).toList())
                .stats(stats)
                .memberProgress(memberProgress)
                .aiInsight(aiInsight)
                .build();
    }

    // =========================================================================
    // WEEKLY VIEW
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public WeeklyViewResponse getWeeklyView(Long projectId, Long userId, LocalDate weekStart) {
        ensureProjectMember(projectId, userId);
        boolean isLeader = isProjectLeader(projectId, userId);

        // Chuẩn hóa weekStart về Thứ 2
        LocalDate monday = weekStart.with(java.time.DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);

        // 1. Task trong tuần
        List<Task> weekTasks = taskRepository.findTasksInWeek(projectId, monday, sunday);
        if (!isLeader) {
            weekTasks.removeIf(t -> t.getPrimaryAssignee() == null || !t.getPrimaryAssignee().getId().equals(userId));
        }

        // Phân tách spanTasks và dayTasks
        List<TaskCalendarItemResponse> spanTasks = new ArrayList<>();
        Map<String, List<TaskCalendarItemResponse>> tasksByDay = new LinkedHashMap<>();
        for (int i = 0; i < 7; i++) {
            tasksByDay.put(monday.plusDays(i).toString(), new ArrayList<>());
        }

        LocalDate today = LocalDate.now();
        for (Task t : weekTasks) {
            LocalDate actualStart = t.getStartDate() != null ? t.getStartDate() : t.getDeadline();
            LocalDate actualEnd = t.getDeadline() != null ? t.getDeadline() : t.getStartDate();

            if (actualStart != null && actualEnd != null) {
                if (actualStart.isAfter(actualEnd)) {
                    LocalDate temp = actualStart;
                    actualStart = actualEnd;
                    actualEnd = temp;
                }

                TaskCalendarItemResponse dto = toCalendarItem(t, today);

                LocalDate renderStart = actualStart.isBefore(monday) ? monday : actualStart;
                LocalDate renderEnd = actualEnd.isAfter(sunday) ? sunday : actualEnd;

                int startIndex = (int) java.time.temporal.ChronoUnit.DAYS.between(monday, renderStart);
                int endIndex = (int) java.time.temporal.ChronoUnit.DAYS.between(monday, renderEnd);

                dto.setSpanStartIndex(startIndex);
                dto.setSpanLength(endIndex - startIndex + 1);
                dto.setIsStartCut(actualStart.isBefore(monday));
                dto.setIsEndCut(actualEnd.isAfter(sunday));

                spanTasks.add(dto);
            }
        }

        // 2. Weekly stats
        int total     = weekTasks.size();
        int completed = (int) weekTasks.stream().filter(t -> "DONE".equals(t.getStatus() != null ? t.getStatus().name() : "")).count();
        int overdue   = (int) weekTasks.stream()
                .filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(today)
                        && t.getStatus() != TaskStatus.DONE).count();
        List<Task> allBlocked = taskRepository.findBlockedTasks(projectId, today);
        if (!isLeader) {
            allBlocked.removeIf(t -> t.getPrimaryAssignee() == null || !t.getPrimaryAssignee().getId().equals(userId));
        }
        int blocked   = allBlocked.size();

        // RTM coverage: % requirement có ít nhất 1 task
        int rtmCoverage = calcRtmCoverage(projectId);

        WeeklyViewResponse.WeeklyStats weekStats = WeeklyViewResponse.WeeklyStats.builder()
                .total(total).completed(completed).overdue(overdue)
                .blocked(blocked).rtmCoverage(rtmCoverage)
                .build();

        // 3. Sprint active
        List<Sprint> overlapping = sprintRepository.findSprintsOverlappingWeek(projectId, monday, sunday);
        Sprint activeSprint = overlapping.isEmpty() ? null : overlapping.get(0);
        WeeklyViewResponse.SprintInfo sprintInfo = buildSprintInfo(activeSprint);

        // 4. Sprint progress
        WeeklyViewResponse.SprintProgress sprintProgress = buildSprintProgress(projectId, activeSprint, monday);

        // 5. Team workload (chỉ tính khối lượng công việc của tuần này)
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        List<MemberProgressResponse> teamWorkload = buildMemberProgress(members, weekTasks, today);

        // 6. AI Insight
        List<Task> blockedTasks = taskRepository.findBlockedTasks(projectId, today);
        AiInsightResponse aiInsight = buildWeeklyAiInsight(overdue, teamWorkload, blockedTasks);

        // Week label
        String weekLabel = buildWeekLabel(monday, sunday);

        return WeeklyViewResponse.builder()
                .weekStart(monday)
                .weekEnd(sunday)
                .weekLabel(weekLabel)
                .spanTasks(spanTasks)
                .tasksByDay(tasksByDay)
                .weekStats(weekStats)
                .activeSprint(sprintInfo)
                .sprintProgress(sprintProgress)
                .teamWorkload(teamWorkload)
                .aiInsight(aiInsight)
                .build();
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private TaskCalendarItemResponse toCalendarItem(Task task, LocalDate today) {
        String displayStatus = resolveDisplayStatus(task, today);
        String assigneeName = resolveAssigneeName(task.getPrimaryAssignee());
        String initials = buildInitials(assigneeName);

        TaskCalendarItemResponse.AssigneeInfo assigneeInfo = null;
        if (task.getPrimaryAssignee() != null) {
            assigneeInfo = TaskCalendarItemResponse.AssigneeInfo.builder()
                    .id(task.getPrimaryAssignee().getId())
                    .name(assigneeName)
                    .email(task.getPrimaryAssignee().getEmail())
                    .initials(initials)
                    .build();
        }

        return TaskCalendarItemResponse.builder()
                .id(task.getId())
                .taskCode(task.getTaskCode())
                .title(task.getTitle())
                .type(task.getType() != null ? task.getType().name() : null)
                .priority(task.getPriority() != null ? task.getPriority().name() : null)
                .status(task.getStatus() != null ? task.getStatus().name() : null)
                .displayStatus(displayStatus)
                .startDate(task.getStartDate())
                .deadline(task.getDeadline())
                .estimatedHours(task.getEstimatedHours())
                .updatedAt(task.getUpdatedAt())
                .blockedReason(task.getBlockedReason())
                .requirementCode(resolveRequirementCode(task.getRequirementId()))
                .requirementId(task.getRequirementId())
                .sprintId(task.getSprintId())
                .sprintName(resolveSprintName(task.getSprintId()))
                .primaryAssignee(assigneeInfo)
                .evidenceCount(evidenceRepository.countByEntityTypeAndEntityId(org.example.backend.entity.EvidenceEntityType.TASK, task.getId()))
                .build();
    }

    private String resolveDisplayStatus(Task task, LocalDate today) {
        if (task.getStatus() == TaskStatus.BLOCKED) return "BLOCKED";
        if (task.getStatus() == TaskStatus.DONE)    return "DONE";
        if (task.getDeadline() != null && task.getDeadline().isBefore(today)) return "OVERDUE";
        return task.getStatus() != null ? task.getStatus().name() : "TODO";
    }

    private String resolveAssigneeName(UserAccount user) {
        if (user == null) return "Unassigned";
        if (user.getProfile() != null && user.getProfile().getFullName() != null) {
            return user.getProfile().getFullName();
        }
        return user.getUsername();
    }

    private String buildInitials(String name) {
        if (name == null || name.isBlank()) return "?";
        String[] parts = name.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!p.isEmpty()) sb.append(Character.toUpperCase(p.charAt(0)));
            if (sb.length() >= 2) break;
        }
        return sb.toString();
    }

    private List<MemberProgressResponse> buildMemberProgress(
            List<ProjectMember> members, List<Task> allTasks, LocalDate today) {

        return members.stream().map(m -> {
            Long uid = m.getUser().getId();
            List<Task> memberTasks = allTasks.stream()
                    .filter(t -> t.getPrimaryAssignee() != null
                            && t.getPrimaryAssignee().getId().equals(uid))
                    .toList();

            int total      = memberTasks.size();
            int done       = (int) memberTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            int inProgress = (int) memberTasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS || t.getStatus() == TaskStatus.IN_REVIEW)
                    .count();
            int late       = (int) memberTasks.stream()
                    .filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(today)
                            && t.getStatus() != TaskStatus.DONE)
                    .count();
            int progress   = total > 0 ? (int) Math.round((done * 100.0) / total) : 0;

            String name = resolveAssigneeName(m.getUser());
            return MemberProgressResponse.builder()
                    .userId(uid)
                    .name(name)
                    .email(m.getUser().getEmail())
                    .initials(buildInitials(name))
                    .projectRole(m.getRole() != null ? m.getRole().getName() : "MEMBER")
                    .totalTasks(total)
                    .doneTasks(done)
                    .inProgressTasks(inProgress)
                    .lateTasks(late)
                    .workloadPercent(progress)
                    .build();
        }).toList();
    }

    private AiInsightResponse buildDailyAiInsight(
            List<Task> overdueAndBlocked, List<Task> blocked, List<ProjectMember> members) {

        List<String> alerts = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        String velocityWarning = null;
        String overloadedMember = null;

        if (!overdueAndBlocked.isEmpty()) {
            velocityWarning = "Nhóm có " + overdueAndBlocked.size() + " task quá hạn hoặc bị blocked hôm nay.";
        }
        if (!blocked.isEmpty()) {
            alerts.add(blocked.size() + " task đang bị BLOCKED cần xử lý ngay.");
        }

        return AiInsightResponse.builder()
                .velocityWarning(velocityWarning)
                .overloadedMember(overloadedMember)
                .suggestions(suggestions)
                .alerts(alerts)
                .generatedAt(LocalDateTime.now().toString())
                .build();
    }

    private AiInsightResponse buildWeeklyAiInsight(
            int overdueCount, List<MemberProgressResponse> teamWorkload, List<Task> blockedTasks) {

        String velocityWarning = overdueCount > 2
                ? "Based on current velocity, the team has " + overdueCount + " overdue tasks this week."
                : null;

        MemberProgressResponse overloaded = teamWorkload.stream()
                .filter(m -> m.getWorkloadPercent() > 90)
                .findFirst().orElse(null);

        String overloadedMember = overloaded != null
                ? overloaded.getName() + " is overloaded with " + overloaded.getTotalTasks() + " active tasks."
                : null;

        List<String> suggestions = new ArrayList<>();
        List<String> alerts = new ArrayList<>();

        if (overloaded != null) {
            suggestions.add("Consider reallocating tasks from " + overloaded.getName() + " to other members.");
        }
        if (!blockedTasks.isEmpty()) {
            alerts.add(blockedTasks.size() + " task(s) are currently blocked and need attention.");
        }

        return AiInsightResponse.builder()
                .velocityWarning(velocityWarning)
                .overloadedMember(overloadedMember)
                .suggestions(suggestions)
                .alerts(alerts)
                .generatedAt(LocalDateTime.now().toString())
                .build();
    }

    private WeeklyViewResponse.SprintInfo buildSprintInfo(Sprint sprint) {
        if (sprint == null) return null;
        int daysLeft = sprint.getEndDate() != null
                ? (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), sprint.getEndDate())
                : 0;
        return WeeklyViewResponse.SprintInfo.builder()
                .id(sprint.getId())
                .name(sprint.getName())
                .goal(sprint.getGoal())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .status(sprint.getStatus() != null ? sprint.getStatus().name() : null)
                .daysLeft(Math.max(0, daysLeft))
                .build();
    }

    private WeeklyViewResponse.SprintProgress buildSprintProgress(
            Long projectId, Sprint activeSprint, LocalDate monday) {

        List<Task> sprintTasks = activeSprint != null
                ? taskRepository.findByProjectIdAndSprintId(projectId, activeSprint.getId())
                : Collections.emptyList();

        int total = sprintTasks.size();
        int done  = (int) sprintTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        int percent = total > 0 ? (int) Math.round((done * 100.0) / total) : 0;

        // Daily completion: số task done theo từng ngày trong tuần
        List<Integer> dailyCompletion = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end   = day.plusDays(1).atStartOfDay();
            int count = taskRepository.findDoneTasksBetween(projectId, start, end).size();
            dailyCompletion.add(count);
        }

        // Story points = sum estimatedHours (proxy)
        int spDone  = sprintTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE)
                .mapToInt(t -> t.getEstimatedHours() != null ? t.getEstimatedHours().intValue() : 0).sum();
        int spTotal = sprintTasks.stream()
                .mapToInt(t -> t.getEstimatedHours() != null ? t.getEstimatedHours().intValue() : 0).sum();

        return WeeklyViewResponse.SprintProgress.builder()
                .percent(percent)
                .tasksDone(done)
                .tasksTotal(total)
                .storyPointsDone(spDone)
                .storyPointsTotal(spTotal)
                .dailyCompletion(dailyCompletion)
                .build();
    }

    private int calcRtmCoverage(Long projectId) {
        long totalReq = requirementRepository.countByProjectId(projectId);
        if (totalReq == 0) return 0;
        long coveredReq = requirementRepository.countRequirementsWithTasksByProjectId(projectId);
        return (int) Math.round((coveredReq * 100.0) / totalReq);
    }

    private String buildWeekLabel(LocalDate monday, LocalDate sunday) {
        java.time.temporal.WeekFields wf = java.time.temporal.WeekFields.ISO;
        int weekNum = monday.get(wf.weekOfWeekBasedYear());
        String start = String.format("%02d/%02d", monday.getDayOfMonth(), monday.getMonthValue());
        String end   = String.format("%02d/%02d/%d", sunday.getDayOfMonth(),
                sunday.getMonthValue(), sunday.getYear());
        return "Week " + weekNum + " · " + start + " – " + end;
    }

    private Task findTask(Long taskId) {
        return taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
    }

    private void applyRequest(Task task, TaskRequest request, Long projectId, Long userId) {
        if (request.getTitle() != null) task.setTitle(requiredText(request.getTitle(), "Task title is required"));
        if (request.getDescription() != null) {
            String newDesc = request.getDescription().trim();
            if (task.getDescription() != null) {
                java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(<!-- sync-source: github-blank(?:-draft|-approved)? -->)").matcher(task.getDescription());
                if (matcher.find()) {
                    String tag = matcher.group(1);
                    if (!newDesc.contains(tag)) {
                        newDesc = newDesc + "\n\n" + tag;
                    }
                }
            }
            task.setDescription(newDesc);
        }
        if (request.isRequirementIdPresent()) {
            if (request.getRequirementId() == null) {
                task.setRequirementId(null);
            } else {
                if (!requirementRepository.existsByIdAndProjectId(request.getRequirementId(), projectId)) {
                    throw new BadRequestException("Requirement does not exist in this project");
                }
                task.setRequirementId(request.getRequirementId());
            }
        }
        if (request.isUseCaseIdPresent()) {
            if (request.getUseCaseId() == null) {
                task.setUseCaseId(null);
            } else {
                if (!useCaseRepository.existsByIdAndProjectId(request.getUseCaseId(), projectId)) {
                    throw new BadRequestException("UseCase does not exist in this project");
                }
                task.setUseCaseId(request.getUseCaseId());
            }
        }
        if (request.getSprintId() == null) {
            task.setSprintId(null);
            task.setSprintPlanDate(null);
        } else {
            if (!sprintRepository.existsByIdAndProjectId(request.getSprintId(), projectId)) {
                throw new BadRequestException("Sprint does not exist in this project");
            }
            if (!request.getSprintId().equals(task.getSprintId())) {
                task.setSprintPlanDate(null);
            }
            task.setSprintId(request.getSprintId());
        }
        if (request.getType() != null) task.setType(parseEnum(request.getType(), TaskType.class, task.getType()));
        if (request.getPriority() != null) task.setPriority(parseEnum(request.getPriority(), Priority.class, task.getPriority()));
        if (request.getStartDate() != null) {
            if (task.getId() == null) {
                if (request.getStartDate().isBefore(java.time.LocalDate.now())) {
                    throw new BadRequestException("Start date cannot be in the past.");
                }
            } else if (!request.getStartDate().equals(task.getStartDate())) {
                if (request.getStartDate().isBefore(java.time.LocalDate.now())) {
                    throw new BadRequestException("Start date cannot be changed to a date in the past.");
                }
            }
        }

        if (request.getStartDate() != null) task.setStartDate(request.getStartDate());
        if (request.getDeadline() != null) task.setDeadline(request.getDeadline());
        
        org.example.backend.util.DateValidationUtils.validateDateRange(task.getStartDate(), task.getDeadline(), "Task");
        
        if (task.getUseCaseId() != null) {
            org.example.backend.entity.UseCase uc = useCaseRepository.findById(task.getUseCaseId()).orElse(null);
            if (uc != null) {
                org.example.backend.util.DateValidationUtils.validateBounds(task.getStartDate(), task.getDeadline(), uc.getStartDate(), uc.getDeadline(), "Task", "Use Case");
            }
        } else if (task.getRequirementId() != null) {
            org.example.backend.entity.Requirement req = requirementRepository.findById(task.getRequirementId()).orElse(null);
            if (req != null) {
                org.example.backend.util.DateValidationUtils.validateBounds(task.getStartDate(), task.getDeadline(), req.getStartDate(), req.getDeadline(), "Task", "Requirement");
            }
        }
        
        if (task.getProject() != null) {
            org.example.backend.util.DateValidationUtils.validateBounds(task.getStartDate(), task.getDeadline(), task.getProject().getStartDate(), task.getProject().getDeadline(), "Task", "Project");
        }
        if (task.getSprintId() != null) {
            Sprint sprint = sprintRepository.findById(task.getSprintId()).orElse(null);
            if (sprint != null) {
                org.example.backend.util.DateValidationUtils.validateBounds(task.getStartDate(), task.getDeadline(), sprint.getStartDate(), sprint.getEndDate(), "Task", "Sprint");
            }
        }
        if (request.getWeight() != null) task.setWeight(validateWeight(request.getWeight()));
        if (request.getEstimatedHours() != null) task.setEstimatedHours(request.getEstimatedHours());
        TaskStatus nextStatus = null;
        if (request.getColumnId() != null) {
            KanbanColumn targetColumn = kanbanColumnRepository.findById(request.getColumnId())
                    .orElseThrow(() -> new BadRequestException("Kanban column not found"));
            if (targetColumn.getStatusKey() != null) {
                nextStatus = parseEnum(targetColumn.getStatusKey(), TaskStatus.class, task.getStatus());
            }
        } else if (request.getStatus() != null) {
            nextStatus = parseEnum(request.getStatus(), TaskStatus.class, task.getStatus());
        }

        if (nextStatus != null) {
            validateStatusTransition(task, nextStatus);
            ensureRegularStatusUpdateAllowed(task, nextStatus, userId);
        }

        if (request.getBlockedReason() != null) task.setBlockedReason(request.getBlockedReason().trim());

        if (request.getColumnId() != null) {
            if (isTightlyBoundToIssue(task)) {
                if (!isProjectLeader(projectId, userId)) {
                    throw new BadRequestException("Only Project Leaders are allowed to change the column of tasks linked to GitHub issues.");
                }
            }
            setColumn(task, request.getColumnId(), projectId, userId);
        } else if (request.getStatus() != null) {
            changeTaskStatus(task, nextStatus, userId);
        }
        if (request.getPrimaryAssigneeId() != null) setAssignee(task, request.getPrimaryAssigneeId(), projectId, userId);
        if (request.getChecklist() != null) {
            boolean isLeader = isProjectLeader(projectId, userId);
            Long assigneeId = task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null;
            if (assigneeId == null && task.getParent() != null && task.getParent().getPrimaryAssignee() != null) {
                assigneeId = task.getParent().getPrimaryAssignee().getId();
            }
            boolean isAssignee = assigneeId != null && userId.equals(assigneeId);
            if (!isLeader && !isAssignee) {
                throw new BadRequestException("Only Project Leaders or the assignee of this task are allowed to update the checklist.");
            }
            replaceChecklist(task, request.getChecklist());
        }
        if (request.getParentId() != null) {
            Task parentTask = taskRepository.findById(request.getParentId())
                    .orElseThrow(() -> new CustomException("Parent task not found", HttpStatus.NOT_FOUND));
            task.setParent(parentTask);
        }
    }

    private void validateStatusTransition(Task task, TaskStatus nextStatus) {
        if (nextStatus == null || nextStatus == TaskStatus.TODO) return;

        boolean hasSubTasks = task.getSubTasks() != null && !task.getSubTasks().isEmpty();

        if (task.getStatus() == TaskStatus.DONE
                && (nextStatus == TaskStatus.IN_REVIEW
                || nextStatus == TaskStatus.NEEDS_CHANGES
                || nextStatus == TaskStatus.IN_PROGRESS)) {
            throw new BadRequestException("Use reopen review or request rework action for completed tasks.");
        }

        if (task.getStatus() == TaskStatus.IN_REVIEW
                && (nextStatus == TaskStatus.DONE
                || nextStatus == TaskStatus.NEEDS_CHANGES
                || nextStatus == TaskStatus.BLOCKED)) {
            throw new BadRequestException("Use review approve or reject action for tasks in review.");
        }

        if (task.getStatus() == TaskStatus.NEEDS_CHANGES
                && nextStatus == TaskStatus.DONE
                && isReviewGateEnabled(task.getProject().getId())) {
            throw new BadRequestException("Task with requested changes must be reviewed before Done.");
        }

        // ONLY block transition for unassigned task if it's moving FROM TODO
        if (task.getStatus() == TaskStatus.TODO && task.getPrimaryAssignee() == null && !hasSubTasks) {
            throw new BadRequestException("Task has not been assigned yet, cannot transition to this status!");
        }

        // Enforce flow: IN_PROGRESS -> IN_REVIEW
        if ((task.getStatus() == TaskStatus.IN_PROGRESS || task.getStatus() == TaskStatus.NEEDS_CHANGES)
                && nextStatus == TaskStatus.DONE) {
            throw new BadRequestException("Task must be transitioned to In Review for approval before moving to Done.");
        }

        if (nextStatus == TaskStatus.IN_REVIEW || nextStatus == TaskStatus.DONE) {
            if (nextStatus == TaskStatus.IN_REVIEW) {
                ensureAcceptedEvidenceBeforeReview(task);
            }

            if (hasSubTasks) {
                boolean allSubTasksDone = task.getSubTasks().stream().allMatch(sub -> sub.getStatus() == TaskStatus.DONE);
                if (!allSubTasksDone) {
                    throw new BadRequestException("Không thể chuyển trạng thái do các task con chưa hoàn thành.");
                }
            }

            if (task.getChecklist() != null && !task.getChecklist().isEmpty()) {
                boolean allChecklistDone = task.getChecklist().stream().allMatch(org.example.backend.entity.TaskChecklist::isDone);
                if (!allChecklistDone) {
                    throw new BadRequestException("Không thể chuyển trạng thái do các yêu cầu (checklist) chưa hoàn thành.");
                }
            }
        }
    }

    private void ensureAcceptedEvidenceBeforeReview(Task task) {
        if (task == null || task.getId() == null) {
            throw new BadRequestException("Task must have evidence before review");
        }
        java.util.List<org.example.backend.entity.EvidenceLink> links = evidenceLinkRepository.findByEntityTypeAndEntityId(
                EvidenceEntityType.TASK,
                task.getId()
        );
        if (links == null || links.isEmpty()) {
            throw new BadRequestException("Task must have evidence before review");
        }
    }

    private void setColumn(Task task, Long columnId, Long projectId, Long userId) {
        KanbanColumn column = kanbanColumnRepository.findById(columnId)
                .filter(item -> item.getProject() != null && projectId.equals(item.getProject().getId()) && !item.isArchived())
                .orElseThrow(() -> new BadRequestException("Kanban column does not exist in this project"));
        task.setKanbanColumn(column);
        if (column.getStatusKey() != null) {
            TaskStatus nextStatus = parseEnum(column.getStatusKey(), TaskStatus.class, task.getStatus());
            changeTaskStatus(task, nextStatus, userId);
        }
    }

    private void setColumnFromStatus(Task task, Long projectId, TaskStatus status) {
        if (status == null) return;
        kanbanColumnService.ensureDefaultColumns(projectId);
        kanbanColumnRepository.findByProjectIdAndStatusKey(projectId, status.name())
                .ifPresent(task::setKanbanColumn);
    }

    private void setAssignee(Task task, Long assigneeId, Long projectId, Long assignerId) {
        if (!isProjectLeader(projectId, assignerId)) {
            throw new BadRequestException("Chỉ có Project Leader hoặc Mentor mới có quyền gán hoặc gỡ người thực hiện task.");
        }

        UserAccount oldAssignee = task.getPrimaryAssignee();

        if (assigneeId == null) {
            task.setPrimaryAssignee(null);
            task.getAssignees().clear();
            if (task.getStatus() != TaskStatus.TODO) {
                TaskStatus oldStatus = task.getStatus();
                task.setStatus(TaskStatus.TODO);
                setColumnFromStatus(task, projectId, TaskStatus.TODO);
                syncSlaPauseForStatusChange(task, oldStatus, TaskStatus.TODO);
            }
            return;
        }

        ensureProjectMember(projectId, assigneeId);
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, assigneeId)
                .orElseThrow(() -> new CustomException("Thành viên không thuộc dự án này.", HttpStatus.FORBIDDEN));
        if (member.getRole() != null && "MENTOR".equalsIgnoreCase(member.getRole().getName())) {
            throw new BadRequestException("Không thể gán task cho Mentor.");
        }

        UserAccount assignee = userAccountRepository.findById(assigneeId)
                .orElseThrow(() -> new CustomException("Assignee not found", HttpStatus.NOT_FOUND));
        task.setPrimaryAssignee(assignee);
        task.getAssignees().clear();
        task.getAssignees().add(assignee);

        if (task.getStatus() == TaskStatus.TODO) {
            TaskStatus oldStatus = task.getStatus();
            task.setStatus(TaskStatus.IN_PROGRESS);
            setColumnFromStatus(task, projectId, TaskStatus.IN_PROGRESS);
            syncSlaPauseForStatusChange(task, oldStatus, TaskStatus.IN_PROGRESS);
        }

        // Gửi thông báo real-time khi gán task
        if (assignerId != null && !assigneeId.equals(assignerId)) {
            if (oldAssignee == null || !oldAssignee.getId().equals(assigneeId)) {
                UserAccount assigner = userAccountRepository.findById(assignerId).orElse(null);
                String assignerName = assigner != null
                        ? (assigner.getProfile() != null && assigner.getProfile().getFullName() != null ? assigner.getProfile().getFullName() : assigner.getUsername())
                        : "Một thành viên";
                boolean isAssignerLeader = isProjectLeader(projectId, assignerId);
                String title = "Bạn được giao task mới";
                String msg = (isAssignerLeader ? "Project Leader " : "") + assignerName + " đã giao task \"" + task.getTitle() + "\" cho bạn.";
                sendNotification(assignee, title, msg, task);
            }
        }
    }

    private void changeTaskStatus(Task task, TaskStatus nextStatus, Long userId) {
        TaskStatus oldStatus = task.getStatus();
        if (oldStatus == nextStatus) {
            return;
        }

        if (nextStatus == TaskStatus.DONE) {
            if (isTightlyBoundToIssue(task)) {
                if (task.getPrimaryAssignee() != null && task.getPrimaryAssignee().getId().equals(userId)) {
                    throw new BadRequestException("Bạn không thể tự phê duyệt task liên kết với GitHub issue của chính mình.");
                }
            }
        }

        task.setStatus(nextStatus);
        setColumnFromStatus(task, task.getProject().getId(), nextStatus);
        syncSlaPauseForStatusChange(task, oldStatus, nextStatus);

        // Ghi mốc bắt đầu lần đầu tiên task vào IN_PROGRESS
        if (nextStatus == TaskStatus.IN_PROGRESS && task.getStartedAt() == null) {
            task.setStartedAt(LocalDateTime.now());
        }

        if (nextStatus == TaskStatus.DONE) {
            if (task.getCompletedAt() == null) {
                task.setCompletedAt(LocalDateTime.now());
            }
            autoCalculateTracking(task);
        } else {
            task.setCompletedAt(null);
        }

        // Gửi thông báo real-time & DB
        if (nextStatus == TaskStatus.IN_REVIEW) {
            UserAccount requester = userAccountRepository.findById(userId).orElse(null);
            String requesterName = requester != null
                    ? (requester.getProfile() != null && requester.getProfile().getFullName() != null ? requester.getProfile().getFullName() : requester.getUsername())
                    : "Một thành viên";

            List<ProjectMember> leaders = new ArrayList<>();
            leaders.addAll(projectMemberRepository.findByProjectIdAndRoleName(task.getProject().getId(), "LEADER"));
            leaders.addAll(projectMemberRepository.findByProjectIdAndRoleName(task.getProject().getId(), "PROJECT_LEADER"));

            List<UserAccount> leaderUsers = leaders.stream()
                    .map(ProjectMember::getUser)
                    .distinct()
                    .toList();

            String title = "Yêu cầu review task";
            String msg = requesterName + " đã yêu cầu review task: " + task.getTitle();
            for (UserAccount leaderUser : leaderUsers) {
                sendNotification(leaderUser, title, msg, task);
            }
        } else if (nextStatus == TaskStatus.DONE && oldStatus == TaskStatus.IN_REVIEW) {
            if (task.getPrimaryAssignee() != null) {
                String title = "Task được phê duyệt";
                String msg = "Task \"" + task.getTitle() + "\" đã được phê duyệt hoàn thành bởi Leader.";
                sendNotification(task.getPrimaryAssignee(), title, msg, task);
            }
        } else if (nextStatus == TaskStatus.IN_PROGRESS && oldStatus == TaskStatus.IN_REVIEW) {
            if (task.getPrimaryAssignee() != null) {
                String title = "Review task thất bại";
                String msg = "Task \"" + task.getTitle() + "\" đã bị từ chối phê duyệt. Vui lòng kiểm tra checklist để cập nhật thêm các yêu cầu về task.";
                sendNotification(task.getPrimaryAssignee(), title, msg, task);
            }
        }

        eventPublisher.publishEvent(new SyncEvent(this, 
            SyncTriggerType.TASK_STATUS_CHANGED, 
            "Task", 
            task.getId(), 
            Map.of("projectId", task.getProject().getId())
        ));
    }

    private void notifyAssignee(Task task, String title, String message) {
        if (task != null && task.getPrimaryAssignee() != null) {
            sendNotification(task.getPrimaryAssignee(), title, message, task);
        }
    }

    private void sendNotification(UserAccount recipient, String title, String message, Task task) {
        notificationService.createAndPush(
                recipient,
                task.getProject(),
                org.example.backend.entity.NotificationEntityType.TASK,
                task.getId(),
                org.example.backend.entity.NotificationType.SYSTEM,
                title,
                message
        );
    }

    private void replaceChecklist(Task task, List<TaskRequest.ChecklistItemRequest> items) {
        if (items == null) return;

        // Map existing checklist items by ID for quick lookup
        Map<Long, TaskChecklist> existingMap = task.getChecklist().stream()
                .filter(item -> item.getId() != null)
                .collect(Collectors.toMap(TaskChecklist::getId, item -> item));

        List<TaskChecklist> updatedList = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            TaskRequest.ChecklistItemRequest itemRequest = items.get(i);
            if (itemRequest.getContent() == null || itemRequest.getContent().trim().isEmpty()) {
                continue;
            }

            String content = itemRequest.getContent().trim();
            boolean done = Boolean.TRUE.equals(itemRequest.getDone());
            int orderIndex = itemRequest.getOrderIndex() != null ? itemRequest.getOrderIndex() : i;

            if (itemRequest.getId() != null && existingMap.containsKey(itemRequest.getId())) {
                // Reuse existing managed entity to preserve ID and prevent stale state deletions
                TaskChecklist existingItem = existingMap.get(itemRequest.getId());
                existingItem.setContent(content);
                existingItem.setDone(done);
                existingItem.setOrderIndex(orderIndex);
                updatedList.add(existingItem);
            } else {
                // Build a new entity for new items
                updatedList.add(TaskChecklist.builder()
                        .task(task)
                        .content(content)
                        .done(done)
                        .orderIndex(orderIndex)
                        .build());
            }
        }

        // Apply clean list mutations preserving orphanRemoval cascade binding
        task.getChecklist().clear();
        task.getChecklist().addAll(updatedList);
    }


    private void ensureProjectLeader(Long projectId, Long userId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));
        String roleName = member.getRole() != null ? member.getRole().getName() : "";
        if (!"PROJECT_LEADER".equalsIgnoreCase(roleName) && !"LEADER".equalsIgnoreCase(roleName) && !"MENTOR".equalsIgnoreCase(roleName)) {
            throw new CustomException("Only project leader or mentor can perform this action", HttpStatus.FORBIDDEN);
        }
    }

    private void ensureRegularStatusUpdateAllowed(Task task, TaskStatus nextStatus, Long userId) {
        // Only DONE is protected; all other status moves continue through the normal Task Board flow.
        if (nextStatus != TaskStatus.DONE) {
            return;
        }
        if (!isReviewGateEnabled(task.getProject().getId())) {
            return;
        }
        if (!isProjectLeader(task.getProject().getId(), userId)) {
            throw new BadRequestException("Task must be reviewed by project leader before Done");
        }
        if (task.getStatus() != TaskStatus.IN_REVIEW) {
            throw new BadRequestException("Move task to In Review before approving it as Done");
        }
        throw new BadRequestException("Use the review approval action to mark this task as Done");
    }

    private boolean isReviewGateEnabled(Long projectId) {
        // Missing config defaults to enabled so new projects are safe by default.
        return codeInsightSettingsRepository.findByProjectId(projectId)
                .map(ProjectCodeInsightSettings::isReviewGateEnabled)
                .orElse(true);
    }

    private void syncGitHubIssueStatus(Task task, Long userId) {
        // Code Insight decisions still keep Issue Tracker/GitHub state in sync without blocking the review flow.
        if (task.getType() != TaskType.BUG_FIX || task.getParent() != null) {
            try {
                gitHubApiService.updateGitHubIssueStatusForTask(task, userId);
            } catch (Exception e) {
                log.warn("Non-blocking GitHub status sync failed for Task ID: {}: {}", task.getId(), e.getMessage());
            }
        }
    }

    private void recordReviewDecision(
            Task task,
            Long reviewerId,
            TaskReviewDecisionType decision,
            TaskStatus fromStatus,
            TaskStatus toStatus,
            String reason) {
        recordReviewDecision(task, reviewerId, decision, fromStatus, toStatus, null, reason);
    }

    private void recordReviewDecision(
            Task task,
            Long reviewerId,
            TaskReviewDecisionType decision,
            TaskStatus fromStatus,
            TaskStatus toStatus,
            Long TaskReviewSnapshotId,
            String reason) {
        UserAccount reviewer = userAccountRepository.findById(reviewerId)
                .orElseThrow(() -> new CustomException("Reviewer not found", HttpStatus.NOT_FOUND));
        taskReviewDecisionRepository.save(TaskReviewDecision.builder()
                .task(task)
                .reviewer(reviewer)
                .decision(decision)
                .fromStatus(fromStatus.name())
                .toStatus(toStatus.name())
                .reason(trimToNull(reason))
                .TaskReviewSnapshotId(TaskReviewSnapshotId)
                .build());
    }

    private boolean isTightlyBoundToIssue(Task task) {
        if (task == null) return false;
        if (task.getGithubIssueNumber() != null) return true;
        if (task.getType() == TaskType.BUG_FIX) return true;
        return bugReportRepository.findByRelatedTaskId(task.getId()).isPresent();
    }

    private void checkAndCompleteParentTask(Task parent) {
        if (parent == null) return;
        List<Task> children = taskRepository.findByParentId(parent.getId());
        if (children.isEmpty()) return;

        boolean allDone = children.stream()
                .allMatch(child -> child.getStatus() == TaskStatus.DONE);

        if (allDone) {
            TaskStatus oldStatus = parent.getStatus();
            parent.setStatus(TaskStatus.DONE);
            if (parent.getCompletedAt() == null) {
                parent.setCompletedAt(LocalDateTime.now());
            }
            setColumnFromStatus(parent, parent.getProject().getId(), TaskStatus.DONE);
            syncSlaPauseForStatusChange(parent, oldStatus, TaskStatus.DONE);
            Task savedParent = taskRepository.save(parent);

            // Sync parent task GitHub issue state (non-blocking)
            if (savedParent.getType() != TaskType.BUG_FIX || savedParent.getParent() != null) {
                try {
                    gitHubApiService.updateGitHubIssueStatusForTask(savedParent, savedParent.getCreatedBy().getId());
                } catch (Exception e) {
                    log.warn("Non-blocking GitHub status sync failed for Parent Task ID: {}: {}", savedParent.getId(), e.getMessage());
                }
            }

            // Recursive completion for higher parents
            if (savedParent.getParent() != null) {
                checkAndCompleteParentTask(savedParent.getParent());
            }
        }
    }

    private void ensureProjectMember(Long projectId, Long userId) {
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isEmpty()) {
            throw new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN);
        }
    }

    private String requiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim();
    }

    private BigDecimal validateWeight(BigDecimal weight) {
        if (weight.compareTo(BigDecimal.ONE) < 0 || weight.compareTo(new BigDecimal("2.0")) > 0) {
            throw new BadRequestException("Task weight must be between 1.0 and 2.0");
        }
        return weight;
    }

    private <T extends Enum<T>> T parseEnum(String value, Class<T> enumType, T fallback) {
        if (value == null || value.trim().isEmpty()) return fallback;
        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid " + enumType.getSimpleName() + ": " + value);
        }
    }

    private List<TaskResponse> toResponses(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Collections.emptyList();
        }
        TaskResponseContext context = buildTaskResponseContext(tasks);
        return tasks.stream()
                .map(task -> toResponse(task, context))
                .collect(Collectors.toList());
    }

    private TaskResponseContext buildTaskResponseContext(List<Task> tasks) {
        Set<Long> taskIds = tasks.stream()
                .map(Task::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<Long> requirementIds = tasks.stream()
                .map(Task::getRequirementId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<Long> sprintIds = tasks.stream()
                .map(Task::getSprintId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, String> requirementCodes = requirementRepository.findAllById(requirementIds).stream()
                .collect(Collectors.toMap(
                        Requirement::getId,
                        requirement -> requirement.getReqCode() != null ? requirement.getReqCode() : "REQ-" + requirement.getId()
                ));

        Map<Long, String> sprintNames = sprintRepository.findAllById(sprintIds).stream()
                .collect(Collectors.toMap(
                        Sprint::getId,
                        sprint -> sprint.getName() != null ? sprint.getName() : "Sprint " + sprint.getId()
                ));

        List<Long> taskIdList = new ArrayList<>(taskIds);
        Set<Long> acceptedEvidenceTaskIds = taskIdList.isEmpty()
                ? Collections.emptySet()
                : evidenceLinkRepository.findEntityIdsWithAcceptedEvidence(
                                EvidenceEntityType.TASK,
                                taskIdList,
                                EvidenceStatus.ACCEPTED
                        ).stream().collect(Collectors.toSet());

        return new TaskResponseContext(requirementCodes, sprintNames, acceptedEvidenceTaskIds);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private TaskResponse toResponse(Task task) {
        return toResponse(task, null);
    }

    private TaskResponse toResponse(Task task, TaskResponseContext context) {
        var sla = taskSlaRuleService.evaluate(task);
        Optional<TaskReviewDecision> latestDecision = taskReviewDecisionRepository.findTopByTaskIdOrderByCreatedAtDesc(task.getId());
        return TaskResponse.builder()
                .id(task.getId())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .requirementId(task.getRequirementId())
                .requirementCode(context != null ? context.requirementCode(task.getRequirementId()) : resolveRequirementCode(task.getRequirementId()))
                .useCaseId(task.getUseCaseId())
                .useCaseCode(resolveUseCaseCode(task.getUseCaseId()))
                .sprintId(task.getSprintId())
                .sprintName(context != null ? context.sprintName(task.getSprintId()) : resolveSprintName(task.getSprintId()))
                .businessModuleId(task.getBusinessModule() != null ? task.getBusinessModule().getId() : null)
                .businessModuleName(task.getBusinessModule() != null ? task.getBusinessModule().getName() : null)
                .title(task.getTitle())
                .description(task.getDescription())
                .type(task.getType() != null ? task.getType().name() : null)
                .primaryAssignee(toUserSummary(task.getPrimaryAssignee()))
                .priority(task.getPriority() != null ? task.getPriority().name() : null)
                .startDate(task.getStartDate())
                .deadline(task.getDeadline())
                .weight(task.getWeight())
                .sprintPlanDate(task.getSprintPlanDate())
                .estimatedHours(task.getEstimatedHours())
                .status(task.getStatus() != null ? task.getStatus().name() : null)
                .columnId(task.getKanbanColumn() != null ? task.getKanbanColumn().getId() : null)
                .columnName(task.getKanbanColumn() != null ? task.getKanbanColumn().getName() : null)
                .blockedReason(task.getBlockedReason())
                .latestReviewDecision(latestDecision.map(item -> item.getDecision().name()).orElse(null))
                .latestReviewReason(latestDecision.map(TaskReviewDecision::getReason).orElse(null))
                .latestReviewDecisionAt(latestDecision.map(TaskReviewDecision::getCreatedAt).orElse(null))
                .overduePenaltyApplied(task.isOverduePenaltyApplied())
                .overduePenaltyAppliedAt(task.getOverduePenaltyAppliedAt())
                .slaCategories(sla.categories().stream().map(Enum::name).collect(Collectors.toList()))
                .overdueDays(sla.overdueDays())
                .hasAcceptedEvidence(context != null && context.hasAcceptedEvidence(task.getId()))
                .evidenceCount(evidenceRepository.countByEntityTypeAndEntityId(org.example.backend.entity.EvidenceEntityType.TASK, task.getId()))
                .createdById(task.getCreatedBy() != null ? task.getCreatedBy().getId() : null)
                .createdByName(task.getCreatedBy() != null ?
                        (task.getCreatedBy().getProfile() != null && task.getCreatedBy().getProfile().getFullName() != null
                                ? task.getCreatedBy().getProfile().getFullName()
                                : task.getCreatedBy().getUsername())
                        : null)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .checklist(task.getChecklist().stream()
                        .sorted(Comparator.comparingInt(TaskChecklist::getOrderIndex))
                        .map(this::toChecklistResponse)
                        .collect(Collectors.toList()))
                .parentId(task.getParent() != null ? task.getParent().getId() : null)
                .parentTitle(task.getParent() != null ? task.getParent().getTitle() : null)
                .githubIssueUrl(task.getGithubIssueUrl())
                .githubIssueNumber(task.getGithubIssueNumber())
                .dependsOnTaskIds(task.getDependsOn() != null ? task.getDependsOn().stream().map(Task::getId).collect(Collectors.toList()) : new java.util.ArrayList<>())
                .build();
    }

    private record TaskResponseContext(
            Map<Long, String> requirementCodes,
            Map<Long, String> sprintNames,
            Set<Long> acceptedEvidenceTaskIds
    ) {
        String requirementCode(Long requirementId) {
            return requirementId == null ? null : requirementCodes.get(requirementId);
        }

        String sprintName(Long sprintId) {
            return sprintId == null ? null : sprintNames.get(sprintId);
        }

        boolean hasAcceptedEvidence(Long taskId) {
            return taskId != null && acceptedEvidenceTaskIds.contains(taskId);
        }
    }


    private TaskReviewDecisionResponse toReviewDecisionResponse(TaskReviewDecision decision) {
        return TaskReviewDecisionResponse.builder()
                .id(decision.getId())
                .decision(decision.getDecision() != null ? decision.getDecision().name() : null)
                .fromStatus(decision.getFromStatus())
                .toStatus(decision.getToStatus())
                .reason(decision.getReason())
                .createdAt(decision.getCreatedAt())
                .task(toTaskSummary(decision.getTask()))
                .reviewer(toReviewUserSummary(decision.getReviewer()))
                .build();
    }

    private TaskReviewDecisionResponse toSyntheticReviewQueueItem(Task task) {
        return TaskReviewDecisionResponse.builder()
                .decision("REQUEST_REVIEW")
                .fromStatus(task.getStatus() != null ? task.getStatus().name() : "IN_REVIEW")
                .toStatus("IN_REVIEW")
                .task(toTaskSummary(task))
                .build();
    }

    private TaskReviewDecisionResponse.TaskSummary toTaskSummary(Task task) {
        return TaskReviewDecisionResponse.TaskSummary.builder()
                .id(task.getId())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .title(task.getTitle())
                .status(task.getStatus() != null ? task.getStatus().name() : null)
                .priority(task.getPriority() != null ? task.getPriority().name() : null)
                .type(task.getType() != null ? task.getType().name() : null)
                .requirementCode(resolveRequirementCode(task.getRequirementId()))
                .assigneeName(task.getPrimaryAssignee() != null ? displayName(task.getPrimaryAssignee()) : "Unassigned")
                .evidenceSummary(codeInsightScoringService.buildReviewEvidenceSummary(task))
                .approvalGate(codeInsightApprovalGateService.evaluate(task))
                .build();
    }

    private TaskReviewDecisionResponse.UserSummary toReviewUserSummary(UserAccount user) {
        if (user == null) return null;
        return TaskReviewDecisionResponse.UserSummary.builder()
                .id(user.getId())
                .name(displayName(user))
                .email(user.getEmail())
                .build();
    }

    private String resolveRequirementCode(Long requirementId) {
        if (requirementId == null) return null;
        return requirementRepository.findById(requirementId)
                .map(requirement -> requirement.getReqCode() != null ? requirement.getReqCode() : "REQ-" + requirement.getId())
                .orElse(null);
    }

    private String resolveUseCaseCode(Long useCaseId) {
        if (useCaseId == null) return null;
        return useCaseRepository.findById(useCaseId)
                .map(uc -> uc.getCode() != null ? uc.getCode() : "UC-" + uc.getId())
                .orElse(null);
    }

    private String resolveSprintName(Long sprintId) {
        if (sprintId == null) return null;
        return sprintRepository.findById(sprintId)
                .map(sprint -> sprint.getName() != null ? sprint.getName() : "Sprint " + sprint.getId())
                .orElse(null);
    }

    private TaskResponse.UserSummary toUserSummary(UserAccount user) {
        if (user == null) return null;
        String name = user.getProfile() != null && user.getProfile().getFullName() != null
                ? user.getProfile().getFullName()
                : user.getUsername();
        return TaskResponse.UserSummary.builder()
                .id(user.getId())
                .name(name)
                .email(user.getEmail())
                .build();
    }

    private String displayName(UserAccount user) {
        return user.getProfile() != null && user.getProfile().getFullName() != null
                ? user.getProfile().getFullName()
                : user.getUsername();
    }

    private TaskResponse.ChecklistItem toChecklistResponse(TaskChecklist item) {
        return TaskResponse.ChecklistItem.builder()
                .id(item.getId())
                .content(item.getContent())
                .done(item.isDone())
                .orderIndex(item.getOrderIndex())
                .build();
    }


    private void syncRequirementStatus(Long requirementId) {
        if (requirementId == null) return;
        Requirement req = requirementRepository.findById(requirementId).orElse(null);
        if (req == null) return;

        List<Task> reqTasks = taskRepository.findByRequirementId(requirementId);
        if (reqTasks.isEmpty()) {
            if (req.getStatus() != RequirementStatus.DRAFT) {
                req.setStatus(RequirementStatus.DRAFT);
                requirementRepository.save(req);
            }
            return;
        }

        boolean allTodo = true;
        boolean allDone = true;
        boolean allReviewOrDone = true;
        boolean hasInProgressOrBlocked = false;

        for (Task t : reqTasks) {
            TaskStatus ts = t.getStatus();
            if (ts != TaskStatus.TODO) allTodo = false;
            if (ts != TaskStatus.DONE) allDone = false;
            if (ts != TaskStatus.IN_REVIEW && ts != TaskStatus.DONE) allReviewOrDone = false;
            if (ts == TaskStatus.IN_PROGRESS || ts == TaskStatus.BLOCKED) hasInProgressOrBlocked = true;
        }

        RequirementStatus newStatus;
        if (allTodo) {
            newStatus = RequirementStatus.DRAFT;
        } else if (allDone) {
            newStatus = RequirementStatus.DONE;
        } else if (allReviewOrDone) {
            newStatus = RequirementStatus.IN_REVIEW;
        } else {
            newStatus = RequirementStatus.IN_PROGRESS;
        }

        if (req.getStatus() != newStatus) {
            req.setStatus(newStatus);
            requirementRepository.save(req);
        }
    }

    private void syncUseCaseStatus(Long useCaseId) {
        if (useCaseId == null) return;
        UseCase uc = useCaseRepository.findById(useCaseId).orElse(null);
        if (uc == null) return;

        List<Task> ucTasks = taskRepository.findByUseCaseId(useCaseId);
        if (ucTasks.isEmpty()) {
            if (uc.getStatus() != UseCaseStatus.DRAFT) {
                uc.setStatus(UseCaseStatus.DRAFT);
                useCaseRepository.save(uc);
            }
            return;
        }

        boolean allTodo = true;
        boolean allDone = true;
        boolean allReviewOrDone = true;
        boolean hasInProgressOrBlocked = false;

        for (Task t : ucTasks) {
            TaskStatus ts = t.getStatus();
            if (ts != TaskStatus.TODO) allTodo = false;
            if (ts != TaskStatus.DONE) allDone = false;
            if (ts != TaskStatus.IN_REVIEW && ts != TaskStatus.DONE) allReviewOrDone = false;
            if (ts == TaskStatus.IN_PROGRESS || ts == TaskStatus.BLOCKED) hasInProgressOrBlocked = true;
        }

        UseCaseStatus newStatus;
        if (allTodo) {
            newStatus = UseCaseStatus.DRAFT;
        } else if (allDone) {
            newStatus = UseCaseStatus.DONE;
        } else if (allReviewOrDone) {
            newStatus = UseCaseStatus.IN_REVIEW;
        } else {
            newStatus = UseCaseStatus.IN_PROGRESS;
        }

        if (uc.getStatus() != newStatus) {
            uc.setStatus(newStatus);
            useCaseRepository.save(uc);
        }
    }

    @Override
    @Transactional
    public void autoApproveTasksExceedingReviewPeriod() {
        log.info("Starting background auto-approval check for IN_REVIEW tasks of Project Leaders exceeding 3 days...");
        List<Task> reviewTasks = taskRepository.findByStatus(TaskStatus.IN_REVIEW);
        LocalDateTime threshold = LocalDateTime.now().minusDays(3);
        int approvedCount = 0;

        for (Task task : reviewTasks) {
            // Only auto-approve if the assignee is a Project Leader
            if (task.getPrimaryAssignee() == null) continue;
            boolean isAssigneeLeader = isProjectLeader(task.getProject().getId(), task.getPrimaryAssignee().getId());
            if (!isAssigneeLeader) continue;

            LocalDateTime timestamp = task.getUpdatedAt() != null ? task.getUpdatedAt() : task.getCreatedAt();
            if (timestamp != null && timestamp.isBefore(threshold)) {
                try {
                    ensureAcceptedEvidenceBeforeReview(task);
                } catch (BadRequestException ex) {
                    log.info("Skipping auto-approval for Task ID {} because accepted evidence is missing", task.getId());
                    continue;
                }
                log.info("Auto-approving Leader Task ID {} (\"{}\") as it has been in review since {}",
                        task.getId(), task.getTitle(), timestamp);
                try {
                    var gate = codeInsightApprovalGateService.evaluate(task);
                    if ("BLOCKED".equals(gate.getApprovalStatus())) {
                        log.warn("Failed to auto-approve Task ID: {} because gate is BLOCKED: {}", task.getId(), String.join(" ", gate.getBlockers()));
                        continue;
                    }
                    changeTaskStatus(task, TaskStatus.DONE, null);
                    taskRepository.save(task);

                    Long systemUserId = task.getCreatedBy() != null ? task.getCreatedBy().getId() : null;
                    syncWithBugReport(task, systemUserId);

                    // Recursive completion if this task is a sub-task
                    if (task.getParent() != null) {
                        checkAndCompleteParentTask(task.getParent());
                    }

                    // Sync GitHub issue state for non-BUG_FIX tasks (non-blocking)
                    if (task.getType() != TaskType.BUG_FIX || task.getParent() != null) {
                        try {
                            gitHubApiService.updateGitHubIssueStatusForTask(task, systemUserId);
                        } catch (Exception e) {
                            log.warn("Non-blocking GitHub status sync failed in auto-approval for Task ID: {}: {}", task.getId(), e.getMessage());
                        }
                    }
                    approvedCount++;
                } catch (Exception e) {
                    log.error("Failed to auto-approve Task ID: {}", task.getId(), e);
                }
            }
        }
        if (approvedCount > 0) {
            log.info("Completed background auto-approval. Total tasks approved: {}", approvedCount);
        }
    }

    private void syncSlaPauseForStatusChange(Task task, TaskStatus oldStatus, TaskStatus newStatus) {
        if (oldStatus == newStatus) {
            return;
        }
        if (oldStatus != TaskStatus.BLOCKED && newStatus == TaskStatus.BLOCKED) {
            String reason = task.getBlockedReason();
            taskSlaPauseService.openPauseIfNeeded(task, reason);
        } else if (oldStatus == TaskStatus.BLOCKED && newStatus != TaskStatus.BLOCKED) {
            taskSlaPauseService.resumeOpenPauseIfNeeded(task);
        }
    }
    
    private void autoCalculateTracking(Task task) {
        LocalDateTime end = task.getCompletedAt();
        if (end == null) return;

        // Actual hours: startedAt nếu có, fallback sang startDate
        LocalDateTime start = task.getStartedAt();
        if (start == null && task.getStartDate() != null) {
            start = task.getStartDate().atStartOfDay();
        }
        java.math.BigDecimal actual = null;
        if (start != null) {
            long minutes = java.time.Duration.between(start, end).toMinutes();
            if (minutes > 0) {
                actual = java.math.BigDecimal.valueOf(minutes)
                        .divide(java.math.BigDecimal.valueOf(60), 2, java.math.RoundingMode.HALF_UP);
                task.setActualHours(actual);
            }
        }

        task.setQualityScore((short) computeQualityScore(task, actual));
    }

    // Graduated quality score — dùng cả khi persist lẫn khi tính trong export
    public static int computeQualityScore(Task task, java.math.BigDecimal ignoredActualHours) {
        LocalDateTime end = task.getCompletedAt();
        if (end == null) return 0;

        int score = 10;

        // Tiêu chí 1: Đúng hạn (graduated -1 / -2 / -3)
        if (task.getDeadline() != null) {
            long daysLate = java.time.temporal.ChronoUnit.DAYS.between(task.getDeadline(), end.toLocalDate());
            if (daysLate > 0) {
                if (daysLate <= 3) score -= 1;
                else if (daysLate <= 7) score -= 2;
                else score -= 3;
            }
        }

        // Tiêu chí 2: SLA overdue penalty
        if (task.isOverduePenaltyApplied()) score -= 2;

        return Math.max(1, score);
    }

    private boolean isProjectLeader(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(pm -> {
                    if (pm.getRole() == null) return false;
                    String roleName = pm.getRole().getName().toUpperCase();
                    return roleName.equals("LEADER") || roleName.equals("PROJECT_LEADER") || roleName.equals("PROJECT LEADER") || roleName.equals("MENTOR");
                })
                .orElse(false);
    }
}
