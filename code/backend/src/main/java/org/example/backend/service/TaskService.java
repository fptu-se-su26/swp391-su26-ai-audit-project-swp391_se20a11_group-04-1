package org.example.backend.service;

import org.example.backend.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface TaskService {
    List<TaskResponse> getProjectTasks(Long projectId, Long userId);
    List<TaskResponse> getMyTasks(Long userId);
    TaskResponse getTask(Long taskId, Long userId);
    TaskResponse createTask(Long projectId, TaskRequest request, Long userId);
    TaskResponse updateTask(Long taskId, TaskRequest request, Long userId);
    TaskResponse updateTaskStatus(Long taskId, TaskStatusUpdateRequest request, Long userId);
    TaskResponse updateTaskAssignee(Long taskId, TaskAssigneeUpdateRequest request, Long userId);
    void deleteTask(Long taskId, Long userId);

    // ── Daily / Weekly View ───────────────────────────────────────────────────
    DailyViewResponse getDailyView(Long projectId, Long userId, LocalDate date);
    WeeklyViewResponse getWeeklyView(Long projectId, Long userId, LocalDate weekStart);
}
