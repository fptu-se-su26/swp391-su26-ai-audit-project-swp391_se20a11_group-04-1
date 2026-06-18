package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.RecoveryPlanAuditLogResponse;
import org.example.backend.dto.RecoveryPlanResponse;
import org.example.backend.dto.RejectRecoveryPlanRequest;
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
    @PatchMapping("/projects/{projectId}/recovery-plans/{planId}/reject")
    public ResponseEntity<ApiResponse<RecoveryPlanResponse>> rejectRecoveryPlan(
            @PathVariable Long projectId,
            @PathVariable Long planId,
            @RequestBody RejectRecoveryPlanRequest request,
            HttpSession session) {
        
        Long userId = requireUser(session);
        String reason = request != null ? request.getReason() : null;
        
        RecoveryPlanResponse response = recoveryPlanService.rejectPlan(projectId, planId, userId, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Recovery plan rejected successfully"));
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
