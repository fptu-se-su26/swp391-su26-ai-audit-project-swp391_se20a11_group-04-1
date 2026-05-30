package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.*;
import org.example.backend.exception.CustomException;
import org.example.backend.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getProjectTasks(@PathVariable Long projectId, HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(taskService.getProjectTasks(projectId, userId), "Tasks retrieved"));
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable Long projectId,
            @RequestBody TaskRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(taskService.createTask(projectId, request, userId), "Task created"));
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable Long taskId, HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(taskService.getTask(taskId, userId), "Task retrieved"));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long taskId,
            @RequestBody TaskRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(taskService.updateTask(taskId, request, userId), "Task updated"));
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long taskId, HttpSession session) {
        Long userId = requireUser(session);
        taskService.deleteTask(taskId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Task deleted"));
    }

    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestBody TaskStatusUpdateRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(taskService.updateTaskStatus(taskId, request, userId), "Task status updated"));
    }

    @PatchMapping("/tasks/{taskId}/assignee")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskAssignee(
            @PathVariable Long taskId,
            @RequestBody TaskAssigneeUpdateRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(taskService.updateTaskAssignee(taskId, request, userId), "Task assignee updated"));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getMyTasks(HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(taskService.getMyTasks(userId), "My tasks retrieved"));
    }

    // ── Daily / Weekly View ───────────────────────────────────────────────────

    /**
     * GET /api/v1/projects/{projectId}/tasks/daily?date=2026-05-27
     * Trả về data đã tính sẵn cho Daily View: overdue/due/done tasks, stats, member progress, AI insight.
     * Nếu không truyền date → dùng ngày hôm nay.
     */
    @GetMapping("/projects/{projectId}/tasks/daily")
    public ResponseEntity<ApiResponse<DailyViewResponse>> getDailyView(
            @PathVariable Long projectId,
            @RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            LocalDate date,
            HttpSession session) {
        Long userId = requireUser(session);
        LocalDate targetDate = (date != null) ? date : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(
                taskService.getDailyView(projectId, userId, targetDate),
                "Daily view retrieved"));
    }

    /**
     * GET /api/v1/projects/{projectId}/tasks/weekly?weekStart=2026-05-25
     * Trả về data đã tính sẵn cho Weekly View: tasksByDay, weekStats, sprint, teamWorkload, AI insight.
     * Nếu không truyền weekStart → dùng Thứ 2 của tuần hiện tại.
     */
    @GetMapping("/projects/{projectId}/tasks/weekly")
    public ResponseEntity<ApiResponse<WeeklyViewResponse>> getWeeklyView(
            @PathVariable Long projectId,
            @RequestParam(required = false)
            @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE)
            LocalDate weekStart,
            HttpSession session) {
        Long userId = requireUser(session);
        LocalDate targetWeekStart = (weekStart != null)
                ? weekStart
                : LocalDate.now().with(DayOfWeek.MONDAY);
        return ResponseEntity.ok(ApiResponse.success(
                taskService.getWeeklyView(projectId, userId, targetWeekStart),
                "Weekly view retrieved"));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
