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
import org.example.backend.repository.KanbanColumnRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.EvidenceRepository;
import org.example.backend.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
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
    private final KanbanColumnRepository kanbanColumnRepository;
    private final KanbanColumnServiceImpl kanbanColumnService;
    private final EvidenceRepository evidenceRepository;

    @Override
    @Transactional
    public List<TaskResponse> getProjectTasks(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);
        kanbanColumnService.ensureDefaultColumns(projectId);
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
                .startDate(request.getStartDate() != null ? request.getStartDate() : java.time.LocalDate.now())
                .weight(request.getWeight() != null ? validateWeight(request.getWeight()) : BigDecimal.ONE)
                .status(parseEnum(request.getStatus(), TaskStatus.class, TaskStatus.TODO))
                .checklist(new ArrayList<>())
                .build();

        applyRequest(task, request, projectId);
        if (task.getKanbanColumn() == null) {
            setColumnFromStatus(task, projectId, task.getStatus());
        }
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
        if (request.getColumnId() != null) {
            setColumn(task, request.getColumnId(), task.getProject().getId());
        } else if (request.getStatus() != null) {
            TaskStatus nextStatus = parseEnum(request.getStatus(), TaskStatus.class, task.getStatus());
            task.setStatus(nextStatus);
            setColumnFromStatus(task, task.getProject().getId(), nextStatus);
            if (nextStatus == TaskStatus.DONE) {
                if (task.getCompletedAt() == null) {
                    task.setCompletedAt(LocalDateTime.now());
                }
            } else {
                task.setCompletedAt(null);
            }
        }
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

    // =========================================================================
    // DAILY VIEW
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public DailyViewResponse getDailyView(Long projectId, Long userId, LocalDate date) {
        ensureProjectMember(projectId, userId);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay   = date.plusDays(1).atStartOfDay();

        // 1. Lấy task theo từng loại
        List<Task> overdue  = taskRepository.findOverdueTasks(projectId, date);
        List<Task> blocked  = taskRepository.findBlockedTasks(projectId, date);
        List<Task> due      = taskRepository.findDueTasks(projectId, date);
        List<Task> ongoing  = taskRepository.findOngoingTasks(projectId, date);
        List<Task> done     = taskRepository.findDoneTasksOnDate(projectId, startOfDay, endOfDay);
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

        // Chuẩn hóa weekStart về Thứ 2
        LocalDate monday = weekStart.with(java.time.DayOfWeek.MONDAY);
        LocalDate sunday = monday.plusDays(6);

        // 1. Task trong tuần
        List<Task> weekTasks = taskRepository.findTasksInWeek(projectId, monday, sunday);

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
        int blocked   = (int) taskRepository.findBlockedTasks(projectId, today).size();

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
                .evidenceCount(evidenceRepository.countByTaskId(task.getId()))
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
        if (request.getStartDate() != null) task.setStartDate(request.getStartDate());
        if (request.getDeadline() != null) task.setDeadline(request.getDeadline());
        if (task.getDeadline() != null && task.getStartDate() != null && task.getDeadline().isBefore(task.getStartDate())) {
            throw new BadRequestException("Task deadline must be on or after start date");
        }
        if (request.getWeight() != null) task.setWeight(validateWeight(request.getWeight()));
        if (request.getEstimatedHours() != null) task.setEstimatedHours(request.getEstimatedHours());
        if (request.getColumnId() != null) {
            setColumn(task, request.getColumnId(), projectId);
        } else if (request.getStatus() != null) {
            TaskStatus nextStatus = parseEnum(request.getStatus(), TaskStatus.class, task.getStatus());
            task.setStatus(nextStatus);
            setColumnFromStatus(task, projectId, nextStatus);
            if (nextStatus == TaskStatus.DONE) {
                if (task.getCompletedAt() == null) {
                    task.setCompletedAt(LocalDateTime.now());
                }
            } else {
                task.setCompletedAt(null);
            }
        }
        if (request.getBlockedReason() != null) task.setBlockedReason(request.getBlockedReason().trim());
        if (request.getPrimaryAssigneeId() != null) setAssignee(task, request.getPrimaryAssigneeId(), projectId);
        if (request.getChecklist() != null) replaceChecklist(task, request.getChecklist());
    }

    private void setColumn(Task task, Long columnId, Long projectId) {
        KanbanColumn column = kanbanColumnRepository.findById(columnId)
                .filter(item -> item.getProject() != null && projectId.equals(item.getProject().getId()) && !item.isArchived())
                .orElseThrow(() -> new BadRequestException("Kanban column does not exist in this project"));
        task.setKanbanColumn(column);
        if (column.getStatusKey() != null) {
            task.setStatus(parseEnum(column.getStatusKey(), TaskStatus.class, task.getStatus()));
        }
    }

    private void setColumnFromStatus(Task task, Long projectId, TaskStatus status) {
        if (status == null) return;
        kanbanColumnService.ensureDefaultColumns(projectId);
        kanbanColumnRepository.findByProjectIdAndStatusKey(projectId, status.name())
                .ifPresent(task::setKanbanColumn);
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
                .startDate(task.getStartDate())
                .deadline(task.getDeadline())
                .weight(task.getWeight())
                .sprintPlanDate(task.getSprintPlanDate())
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
