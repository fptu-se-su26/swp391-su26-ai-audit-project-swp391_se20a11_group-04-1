package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.*;
import org.example.backend.entity.*;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.SprintService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class SprintServiceImpl implements SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final RequirementRepository requirementRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SprintResponse> getProjectSprints(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);
        Map<Long, List<Task>> tasksBySprintId = taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId).stream()
                .filter(task -> task.getSprintId() != null)
                .collect(Collectors.groupingBy(Task::getSprintId));
        return sprintRepository.findByProjectIdOrderByStartDateAscIdAsc(projectId).stream()
                .map(sprint -> toSprintResponse(sprint, tasksBySprintId.getOrDefault(sprint.getId(), List.of())))
                .collect(Collectors.toList());
    }

    @Override
    public SprintResponse createSprint(Long projectId, SprintRequest request, Long userId) {
        ensureProjectMember(projectId, userId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));

        Sprint sprint = Sprint.builder()
                .project(project)
                .name(requiredText(request.getName(), "Sprint name is required"))
                .goal(trimToNull(request.getGoal()))
                .startDate(requiredDate(request.getStartDate(), "Sprint start date is required"))
                .endDate(requiredDate(request.getEndDate(), "Sprint end date is required"))
                .status(parseEnum(request.getStatus(), SprintStatus.class, SprintStatus.PLANNED))
                .capacityHours(validateCapacity(request.getCapacityHours()))
                .build();
        validateDateRange(sprint.getStartDate(), sprint.getEndDate());
        validateScheduleRules(projectId, null, sprint.getStartDate(), sprint.getEndDate(), sprint.getStatus());

        return toSprintResponse(sprintRepository.save(sprint));
    }

    @Override
    @Transactional(readOnly = true)
    public SprintResponse getSprint(Long projectId, Long sprintId, Long userId) {
        ensureProjectMember(projectId, userId);
        return toSprintResponse(findSprint(projectId, sprintId));
    }

    @Override
    public SprintResponse updateSprint(Long projectId, Long sprintId, SprintRequest request, Long userId) {
        ensureProjectMember(projectId, userId);
        Sprint sprint = findSprint(projectId, sprintId);

        sprint.setName(requiredText(request.getName(), "Sprint name is required"));
        sprint.setGoal(trimToNull(request.getGoal()));
        sprint.setStartDate(requiredDate(request.getStartDate(), "Sprint start date is required"));
        sprint.setEndDate(requiredDate(request.getEndDate(), "Sprint end date is required"));
        sprint.setCapacityHours(validateCapacity(request.getCapacityHours()));
        if (request.getStatus() != null) {
            sprint.setStatus(parseEnum(request.getStatus(), SprintStatus.class, sprint.getStatus()));
        }
        validateDateRange(sprint.getStartDate(), sprint.getEndDate());
        validateScheduleRules(projectId, sprint.getId(), sprint.getStartDate(), sprint.getEndDate(), sprint.getStatus());
        clearOutOfRangePlanDates(sprint);

        return toSprintResponse(sprintRepository.save(sprint));
    }

    @Override
    public void deleteSprint(Long projectId, Long sprintId, Long userId) {
        ensureProjectMember(projectId, userId);
        Sprint sprint = findSprint(projectId, sprintId);
        if (taskRepository.countBySprintId(sprintId) > 0) {
            throw new BadRequestException("Cannot delete sprint while tasks are assigned");
        }
        sprintRepository.delete(sprint);
    }

    @Override
    public SprintResponse updateSprintStatus(Long projectId, Long sprintId, SprintStatusUpdateRequest request, Long userId) {
        ensureProjectMember(projectId, userId);
        Sprint sprint = findSprint(projectId, sprintId);
        SprintStatus nextStatus = parseRequiredEnum(request != null ? request.getStatus() : null, SprintStatus.class, "Sprint status is required");
        validateScheduleRules(projectId, sprint.getId(), sprint.getStartDate(), sprint.getEndDate(), nextStatus);
        sprint.setStatus(nextStatus);
        return toSprintResponse(sprintRepository.save(sprint));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getSprintTasks(Long projectId, Long sprintId, Long userId) {
        ensureProjectMember(projectId, userId);
        findSprint(projectId, sprintId);
        return taskRepository.findByProjectIdAndSprintIdOrderBySprintPlanDateAscUpdatedAtDesc(projectId, sprintId).stream()
                .map(this::toTaskResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TaskResponse assignTask(Long projectId, Long sprintId, Long taskId, Long userId) {
        ensureProjectMember(projectId, userId);
        Sprint sprint = findSprint(projectId, sprintId);
        Task task = findProjectTask(projectId, taskId);

        if (task.getSprintId() != null && !Objects.equals(task.getSprintId(), sprint.getId())) {
            throw new BadRequestException("Task is already assigned to another sprint");
        }
        task.setSprintId(sprint.getId());
        if (task.getSprintPlanDate() != null && !isInsideSprint(task.getSprintPlanDate(), sprint)) {
            task.setSprintPlanDate(null);
        }
        return toTaskResponse(taskRepository.save(task));
    }

    @Override
    public TaskResponse removeTask(Long projectId, Long sprintId, Long taskId, Long userId) {
        ensureProjectMember(projectId, userId);
        findSprint(projectId, sprintId);
        Task task = findProjectTask(projectId, taskId);
        if (!Objects.equals(task.getSprintId(), sprintId)) {
            throw new BadRequestException("Task is not assigned to this sprint");
        }

        task.setSprintId(null);
        task.setSprintPlanDate(null);
        return toTaskResponse(taskRepository.save(task));
    }

    @Override
    public TaskResponse updateTaskPlanDate(Long projectId, Long sprintId, Long taskId, SprintTaskPlanDateRequest request, Long userId) {
        ensureProjectMember(projectId, userId);
        Sprint sprint = findSprint(projectId, sprintId);
        Task task = findProjectTask(projectId, taskId);
        if (!Objects.equals(task.getSprintId(), sprintId)) {
            throw new BadRequestException("Task is not assigned to this sprint");
        }

        LocalDate planDate = request.getSprintPlanDate();
        if (planDate != null && !isInsideSprint(planDate, sprint)) {
            throw new BadRequestException("Sprint plan date must be inside sprint date range");
        }
        task.setSprintPlanDate(planDate);
        return toTaskResponse(taskRepository.save(task));
    }

    private Sprint findSprint(Long projectId, Long sprintId) {
        return sprintRepository.findByIdAndProjectId(sprintId, projectId)
                .orElseThrow(() -> new CustomException("Sprint not found", HttpStatus.NOT_FOUND));
    }

    private Task findProjectTask(Long projectId, Long taskId) {
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
        if (task.getProject() == null || !Objects.equals(task.getProject().getId(), projectId)) {
            throw new BadRequestException("Task does not belong to this project");
        }
        return task;
    }

    private void ensureProjectMember(Long projectId, Long userId) {
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isEmpty()) {
            throw new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN);
        }
    }

    private void clearOutOfRangePlanDates(Sprint sprint) {
        taskRepository.findByProjectIdAndSprintIdOrderBySprintPlanDateAscUpdatedAtDesc(sprint.getProject().getId(), sprint.getId())
                .forEach(task -> {
                    if (task.getSprintPlanDate() != null && !isInsideSprint(task.getSprintPlanDate(), sprint)) {
                        task.setSprintPlanDate(null);
                    }
                });
    }

    private boolean isInsideSprint(LocalDate date, Sprint sprint) {
        return !date.isBefore(sprint.getStartDate()) && !date.isAfter(sprint.getEndDate());
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("Sprint end date must be on or after start date");
        }
    }

    private void validateScheduleRules(Long projectId, Long sprintId, LocalDate startDate, LocalDate endDate, SprintStatus status) {
        if (sprintRepository.existsOverlappingSprint(projectId, sprintId, startDate, endDate)) {
            throw new BadRequestException("Sprint date range overlaps with another sprint in this project");
        }
        if (status == SprintStatus.ACTIVE
                && sprintRepository.existsByProjectIdAndStatusExcludingId(projectId, SprintStatus.ACTIVE, sprintId)) {
            throw new BadRequestException("Only one active sprint is allowed per project");
        }
    }

    private BigDecimal validateCapacity(BigDecimal capacityHours) {
        if (capacityHours == null) return null;
        if (capacityHours.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Sprint capacity hours must be greater than or equal to zero");
        }
        return capacityHours;
    }

    private String requiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private LocalDate requiredDate(LocalDate value, String message) {
        if (value == null) {
            throw new BadRequestException(message);
        }
        return value;
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) return null;
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

    private <T extends Enum<T>> T parseRequiredEnum(String value, Class<T> enumType, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(message);
        }
        return parseEnum(value, enumType, null);
    }

    private SprintResponse toSprintResponse(Sprint sprint) {
        return toSprintResponse(sprint, taskRepository.findByProjectIdAndSprintIdOrderBySprintPlanDateAscUpdatedAtDesc(
                sprint.getProject().getId(),
                sprint.getId()
        ));
    }

    private SprintResponse toSprintResponse(Sprint sprint, List<Task> tasks) {
        int totalTasks = tasks.size();
        int doneTasks = (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.DONE).count();
        int inProgressTasks = (int) tasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.IN_PROGRESS || task.getStatus() == TaskStatus.IN_REVIEW)
                .count();
        int blockedTasks = (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.BLOCKED).count();
        int overdueTasks = (int) tasks.stream()
                .filter(task -> task.getDeadline() != null
                        && task.getStatus() != TaskStatus.DONE
                        && task.getDeadline().isBefore(LocalDate.now()))
                .count();
        BigDecimal estimatedHours = tasks.stream()
                .map(Task::getEstimatedHours)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return SprintResponse.builder()
                .id(sprint.getId())
                .projectId(sprint.getProject() != null ? sprint.getProject().getId() : null)
                .name(sprint.getName())
                .goal(sprint.getGoal())
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .status(sprint.getStatus() != null ? sprint.getStatus().name() : null)
                .capacityHours(sprint.getCapacityHours())
                .createdAt(sprint.getCreatedAt())
                .updatedAt(sprint.getUpdatedAt())
                .totalTasks(totalTasks)
                .doneTasks(doneTasks)
                .inProgressTasks(inProgressTasks)
                .blockedTasks(blockedTasks)
                .riskCount(blockedTasks + overdueTasks)
                .progressPercent(totalTasks == 0 ? 0 : Math.round((doneTasks * 100f) / totalTasks))
                .estimatedHours(estimatedHours)
                .capacityUsagePercent(capacityUsagePercent(estimatedHours, sprint.getCapacityHours()))
                .build();
    }

    private int capacityUsagePercent(BigDecimal estimatedHours, BigDecimal capacityHours) {
        if (capacityHours == null || capacityHours.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return estimatedHours.multiply(BigDecimal.valueOf(100))
                .divide(capacityHours, 0, RoundingMode.HALF_UP)
                .intValue();
    }

    private TaskResponse toTaskResponse(Task task) {
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
                .startDate(task.getStartDate())
                .deadline(task.getDeadline())
                .sprintPlanDate(task.getSprintPlanDate())
                .weight(task.getWeight())
                .estimatedHours(task.getEstimatedHours())
                .status(task.getStatus() != null ? task.getStatus().name() : null)
                .columnId(task.getKanbanColumn() != null ? task.getKanbanColumn().getId() : null)
                .columnName(task.getKanbanColumn() != null ? task.getKanbanColumn().getName() : null)
                .blockedReason(task.getBlockedReason())
                .overduePenaltyApplied(task.isOverduePenaltyApplied())
                .overduePenaltyAppliedAt(task.getOverduePenaltyAppliedAt())
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
