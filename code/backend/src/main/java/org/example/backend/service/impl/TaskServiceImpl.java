package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TaskAssigneeUpdateRequest;
import org.example.backend.dto.TaskRequest;
import org.example.backend.dto.TaskResponse;
import org.example.backend.dto.TaskStatusUpdateRequest;
import org.example.backend.entity.*;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserAccountRepository userAccountRepository;
    private final RequirementRepository requirementRepository;
    private final SprintRepository sprintRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getProjectTasks(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);
        return taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(Long userId) {
        return taskRepository.findByPrimaryAssigneeIdOrderByUpdatedAtDesc(userId).stream()
                .filter(task -> projectMemberRepository.findByProjectIdAndUserId(task.getProject().getId(), userId).isPresent())
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTask(Long taskId, Long userId) {
        Task task = findTask(taskId);
        ensureProjectMember(task.getProject().getId(), userId);
        return toResponse(task);
    }

    @Override
    public TaskResponse createTask(Long projectId, TaskRequest request, Long userId) {
        ensureProjectMember(projectId, userId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
        UserAccount creator = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        Task task = Task.builder()
                .project(project)
                .createdBy(creator)
                .title(requiredText(request.getTitle(), "Task title is required"))
                .type(parseEnum(request.getType(), TaskType.class, TaskType.DEVELOPMENT))
                .priority(parseEnum(request.getPriority(), Priority.class, Priority.MEDIUM))
                .status(parseEnum(request.getStatus(), TaskStatus.class, TaskStatus.TODO))
                .checklist(new ArrayList<>())
                .build();

        applyRequest(task, request, projectId);
        return toResponse(taskRepository.save(task));
    }

    @Override
    public TaskResponse updateTask(Long taskId, TaskRequest request, Long userId) {
        Task task = findTask(taskId);
        ensureProjectMember(task.getProject().getId(), userId);
        applyRequest(task, request, task.getProject().getId());
        return toResponse(taskRepository.save(task));
    }

    @Override
    public TaskResponse updateTaskStatus(Long taskId, TaskStatusUpdateRequest request, Long userId) {
        Task task = findTask(taskId);
        ensureProjectMember(task.getProject().getId(), userId);
        task.setStatus(parseEnum(request.getStatus(), TaskStatus.class, task.getStatus()));
        if (request.getBlockedReason() != null) {
            task.setBlockedReason(request.getBlockedReason().trim());
        }
        return toResponse(taskRepository.save(task));
    }

    @Override
    public TaskResponse updateTaskAssignee(Long taskId, TaskAssigneeUpdateRequest request, Long userId) {
        Task task = findTask(taskId);
        Long projectId = task.getProject().getId();
        ensureProjectMember(projectId, userId);
        setAssignee(task, request.getAssigneeId(), projectId);
        return toResponse(taskRepository.save(task));
    }

    @Override
    public void deleteTask(Long taskId, Long userId) {
        Task task = findTask(taskId);
        ensureProjectMember(task.getProject().getId(), userId);
        taskRepository.delete(task);
    }

    private Task findTask(Long taskId) {
        return taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
    }

    private void applyRequest(Task task, TaskRequest request, Long projectId) {
        if (request.getTitle() != null) task.setTitle(requiredText(request.getTitle(), "Task title is required"));
        if (request.getDescription() != null) task.setDescription(request.getDescription().trim());
        if (request.getRequirementId() == null) {
            task.setRequirementId(null);
        } else {
            if (!requirementRepository.existsByIdAndProjectId(request.getRequirementId(), projectId)) {
                throw new BadRequestException("Requirement does not exist in this project");
            }
            task.setRequirementId(request.getRequirementId());
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
        if (request.getDeadline() != null) task.setDeadline(request.getDeadline());
        if (request.getEstimatedHours() != null) task.setEstimatedHours(request.getEstimatedHours());
        if (request.getStatus() != null) task.setStatus(parseEnum(request.getStatus(), TaskStatus.class, task.getStatus()));
        if (request.getBlockedReason() != null) task.setBlockedReason(request.getBlockedReason().trim());
        if (request.getPrimaryAssigneeId() != null) setAssignee(task, request.getPrimaryAssigneeId(), projectId);
        if (request.getChecklist() != null) replaceChecklist(task, request.getChecklist());
    }

    private void setAssignee(Task task, Long assigneeId, Long projectId) {
        if (assigneeId == null) {
            task.setPrimaryAssignee(null);
            task.getAssignees().clear();
            return;
        }

        ensureProjectMember(projectId, assigneeId);
        UserAccount assignee = userAccountRepository.findById(assigneeId)
                .orElseThrow(() -> new CustomException("Assignee not found", HttpStatus.NOT_FOUND));
        task.setPrimaryAssignee(assignee);
        task.getAssignees().clear();
        task.getAssignees().add(assignee);
    }

    private void replaceChecklist(Task task, List<TaskRequest.ChecklistItemRequest> items) {
        task.getChecklist().clear();
        for (int i = 0; i < items.size(); i++) {
            TaskRequest.ChecklistItemRequest item = items.get(i);
            if (item.getContent() == null || item.getContent().trim().isEmpty()) continue;
            task.getChecklist().add(TaskChecklist.builder()
                    .task(task)
                    .content(item.getContent().trim())
                    .done(Boolean.TRUE.equals(item.getDone()))
                    .orderIndex(item.getOrderIndex() != null ? item.getOrderIndex() : i)
                    .build());
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

    private <T extends Enum<T>> T parseEnum(String value, Class<T> enumType, T fallback) {
        if (value == null || value.trim().isEmpty()) return fallback;
        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid " + enumType.getSimpleName() + ": " + value);
        }
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .requirementId(task.getRequirementId())
                .requirementCode(resolveRequirementCode(task.getRequirementId()))
                .sprintId(task.getSprintId())
                .sprintName(resolveSprintName(task.getSprintId()))
                .title(task.getTitle())
                .description(task.getDescription())
                .type(task.getType() != null ? task.getType().name() : null)
                .primaryAssignee(toUserSummary(task.getPrimaryAssignee()))
                .priority(task.getPriority() != null ? task.getPriority().name() : null)
                .deadline(task.getDeadline())
                .sprintPlanDate(task.getSprintPlanDate())
                .estimatedHours(task.getEstimatedHours())
                .status(task.getStatus() != null ? task.getStatus().name() : null)
                .blockedReason(task.getBlockedReason())
                .createdById(task.getCreatedBy() != null ? task.getCreatedBy().getId() : null)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .checklist(task.getChecklist().stream()
                        .sorted(Comparator.comparingInt(TaskChecklist::getOrderIndex))
                        .map(this::toChecklistResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private String resolveRequirementCode(Long requirementId) {
        if (requirementId == null) return null;
        return requirementRepository.findById(requirementId)
                .map(requirement -> requirement.getReqCode() != null ? requirement.getReqCode() : "REQ-" + requirement.getId())
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

    private TaskResponse.ChecklistItem toChecklistResponse(TaskChecklist item) {
        return TaskResponse.ChecklistItem.builder()
                .id(item.getId())
                .content(item.getContent())
                .done(item.isDone())
                .orderIndex(item.getOrderIndex())
                .build();
    }
}
