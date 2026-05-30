package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.*;
import org.example.backend.exception.CustomException;
import org.example.backend.service.SprintService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SprintResponse>>> getProjectSprints(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(sprintService.getProjectSprints(projectId, userId), "Sprints retrieved"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SprintResponse>> createSprint(
            @PathVariable Long projectId,
            @RequestBody SprintRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(sprintService.createSprint(projectId, request, userId), "Sprint created"));
    }

    @GetMapping("/{sprintId}")
    public ResponseEntity<ApiResponse<SprintResponse>> getSprint(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(sprintService.getSprint(projectId, sprintId, userId), "Sprint retrieved"));
    }

    @PutMapping("/{sprintId}")
    public ResponseEntity<ApiResponse<SprintResponse>> updateSprint(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            @RequestBody SprintRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(sprintService.updateSprint(projectId, sprintId, request, userId), "Sprint updated"));
    }

    @DeleteMapping("/{sprintId}")
    public ResponseEntity<ApiResponse<Void>> deleteSprint(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            HttpSession session) {
        Long userId = requireUser(session);
        sprintService.deleteSprint(projectId, sprintId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Sprint deleted"));
    }

    @PatchMapping("/{sprintId}/status")
    public ResponseEntity<ApiResponse<SprintResponse>> updateSprintStatus(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            @RequestBody SprintStatusUpdateRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(sprintService.updateSprintStatus(projectId, sprintId, request, userId), "Sprint status updated"));
    }

    @GetMapping("/{sprintId}/tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getSprintTasks(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(sprintService.getSprintTasks(projectId, sprintId, userId), "Sprint tasks retrieved"));
    }

    @PostMapping("/{sprintId}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> assignTask(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(sprintService.assignTask(projectId, sprintId, taskId, userId), "Task assigned to sprint"));
    }

    @DeleteMapping("/{sprintId}/tasks/{taskId}")
    public ResponseEntity<ApiResponse<TaskResponse>> removeTask(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(sprintService.removeTask(projectId, sprintId, taskId, userId), "Task removed from sprint"));
    }

    @PatchMapping("/{sprintId}/tasks/{taskId}/plan-date")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskPlanDate(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            @PathVariable Long taskId,
            @RequestBody SprintTaskPlanDateRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(sprintService.updateTaskPlanDate(projectId, sprintId, taskId, request, userId), "Sprint task plan date updated"));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
