package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.RecoveryPlanAuditLogResponse;
import org.example.backend.dto.RecoveryPlanResponse;
import org.example.backend.dto.RecoveryTaskReviewResponse;
import org.example.backend.dto.UpdateRecoveryPlanRequest;
import org.example.backend.exception.CustomException;
import org.example.backend.service.sla.RecoveryPlanService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RecoveryPlanController {

    private final RecoveryPlanService recoveryPlanService;

    @PreAuthorize("@projectSecurity.isLeaderOrMentor(#projectId)")
    @PostMapping("/projects/{projectId}/tasks/{taskId}/recovery-plans/generate")
    public ResponseEntity<ApiResponse<RecoveryPlanResponse>> generateRecoveryPlan(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        
        Long userId = requireUser(session);
        
        // TODO: Phase 4 - Add Permission check (e.g. check if user is Leader/Mentor of the project)
        
        RecoveryPlanResponse response = recoveryPlanService.generateForTask(projectId, taskId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Recovery plan generated successfully"));
    }

    @GetMapping("/projects/{projectId}/tasks/{taskId}/recovery-plans/latest")
    public ResponseEntity<ApiResponse<RecoveryPlanResponse>> getLatestRecoveryPlan(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        
        Long userId = requireUser(session);
        
        RecoveryPlanResponse response = recoveryPlanService.getLatestForTask(projectId, taskId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Latest recovery plan retrieved successfully"));
    }

    @GetMapping("/projects/{projectId}/recovery-plans")
    public ResponseEntity<ApiResponse<List<RecoveryPlanResponse>>> getProjectRecoveryPlans(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long sprintId,
            @RequestParam(required = false) String status,
            HttpSession session) {
        
        Long userId = requireUser(session);
        List<String> statuses = null;
        if (status != null && !status.trim().isEmpty()) {
            statuses = java.util.Arrays.asList(status.split(","));
        }
        
        List<RecoveryPlanResponse> response = recoveryPlanService.getProjectPlans(projectId, sprintId, statuses, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Recovery plans retrieved successfully"));
    }

    @GetMapping("/projects/{projectId}/recovery-tasks")
    public ResponseEntity<ApiResponse<List<RecoveryTaskReviewResponse>>> getProjectRecoveryTasks(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long sprintId,
            HttpSession session) {

        Long userId = requireUser(session);
        List<RecoveryTaskReviewResponse> response = recoveryPlanService.getProjectRecoveryTasks(projectId, sprintId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Recovery tasks retrieved successfully"));
    }

    @PreAuthorize("@projectSecurity.isLeaderOrMentor(#projectId)")
    @PostMapping("/projects/{projectId}/recovery-plans/generate")
    public ResponseEntity<ApiResponse<List<RecoveryPlanResponse>>> generateProjectRecoveryPlans(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long sprintId,
            HttpSession session) {

        Long userId = requireUser(session);
        List<RecoveryPlanResponse> response = recoveryPlanService.generateForProject(projectId, sprintId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Recovery plans generated successfully"));
    }

    @PreAuthorize("@projectSecurity.isLeaderOrMentor(#projectId)")
    @PatchMapping("/projects/{projectId}/recovery-plans/{planId}")
    public ResponseEntity<ApiResponse<RecoveryPlanResponse>> updateRecoveryPlan(
            @PathVariable Long projectId,
            @PathVariable Long planId,
            @RequestBody UpdateRecoveryPlanRequest request,
            HttpSession session) {

        Long userId = requireUser(session);

        RecoveryPlanResponse response = recoveryPlanService.updatePlan(projectId, planId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Recovery plan updated successfully"));
    }

    @PreAuthorize("@projectSecurity.isLeaderOrMentor(#projectId)")
    @PatchMapping("/projects/{projectId}/recovery-plans/{planId}/approve")
    public ResponseEntity<ApiResponse<RecoveryPlanResponse>> approveRecoveryPlan(
            @PathVariable Long projectId,
            @PathVariable Long planId,
            HttpSession session) {
        
        Long userId = requireUser(session);
        
        RecoveryPlanResponse response = recoveryPlanService.approvePlan(projectId, planId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Recovery plan approved successfully"));
    }

    @PreAuthorize("@projectSecurity.isLeaderOrMentor(#projectId)")
    @PatchMapping("/projects/{projectId}/recovery-plans/{planId}/execute")
    public ResponseEntity<ApiResponse<RecoveryPlanResponse>> executeRecoveryPlan(
            @PathVariable Long projectId,
            @PathVariable Long planId,
            HttpSession session) {
        
        Long userId = requireUser(session);
        
        RecoveryPlanResponse response = recoveryPlanService.executePlan(projectId, planId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Recovery plan executed successfully"));
    }

    @GetMapping("/projects/{projectId}/recovery-plans/{planId}/audit-logs")
    public ResponseEntity<ApiResponse<List<RecoveryPlanAuditLogResponse>>> getAuditLogs(
            @PathVariable Long projectId,
            @PathVariable Long planId,
            HttpSession session) {
        
        Long userId = requireUser(session);
        List<RecoveryPlanAuditLogResponse> logs = recoveryPlanService.getAuditLogs(projectId, planId, userId);
        return ResponseEntity.ok(ApiResponse.success(logs, "Audit logs retrieved successfully"));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
