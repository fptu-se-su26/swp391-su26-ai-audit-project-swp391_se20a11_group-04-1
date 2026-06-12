package org.example.backend.service;

import org.example.backend.dto.*;

import java.time.LocalDate;
import java.util.List;

public interface TaskService {
    List<TaskResponse> getProjectTasks(Long projectId, Long userId);
    List<TaskResponse> getHotTasks(Long projectId, Long userId, int limit);
    List<TaskResponse> getMyTasks(Long userId);
    TaskResponse getTask(Long taskId, Long userId);
    TaskResponse createTask(Long projectId, TaskRequest request, Long userId);
    TaskResponse updateTask(Long taskId, TaskRequest request, Long userId);
    TaskResponse updateTaskStatus(Long taskId, TaskStatusUpdateRequest request, Long userId);
    TaskResponse updateTaskAssignee(Long taskId, TaskAssigneeUpdateRequest request, Long userId);

    // Move a task into IN_REVIEW and write a Code Insight review request record.
    TaskResponse requestTaskReview(Long taskId, TaskReviewRequest request, Long userId);

    // Leader-only approval that marks an IN_REVIEW task as DONE.
    TaskResponse approveTaskReview(Long taskId, TaskReviewRequest request, Long userId);

    // Leader-only rejection that returns an IN_REVIEW task to work with feedback.
    TaskResponse rejectTaskReview(Long taskId, TaskReviewRequest request, Long userId);

    // Load the project review queue shown on the Code Insight page.
    List<TaskReviewDecisionResponse> getProjectReviewQueue(Long projectId, Long userId);
    void deleteTask(Long taskId, Long userId);

    // ── Daily / Weekly View ───────────────────────────────────────────────────
    DailyViewResponse getDailyView(Long projectId, Long userId, LocalDate date);
    WeeklyViewResponse getWeeklyView(Long projectId, Long userId, LocalDate weekStart);

    void autoApproveTasksExceedingReviewPeriod();
}
