package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;
import org.example.backend.dto.TaskReviewDashboardResponse;
import org.example.backend.dto.EvidenceSearchResponse;
import org.example.backend.dto.ManualEvidenceLinkRequest;
import org.example.backend.dto.ManualEvidenceLinkResponse;
import org.example.backend.dto.TaskReviewDetailResponse;
import org.example.backend.dto.TaskEvidenceResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.ManualEvidenceLinkService;
import org.example.backend.service.TaskReviewService;
import org.example.backend.service.TaskService;
import org.example.backend.annotation.PreAuthorizeProjectLeader;
import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/task-reviews")
@RequiredArgsConstructor
@PreAuthorizeProjectMember
public class TaskReviewController {

    private final TaskService taskService;
    private final TaskReviewService TaskReviewService;
    private final ManualEvidenceLinkService manualEvidenceLinkService;

    // Read the current GitHub repository and Code Insight rule settings for this project.
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<CodeInsightConfigResponse>> getConfig(
            @PathVariable Long projectId,
            HttpSession session) {
        // Pull userId from HTTP session because project authorization is session based in this app.
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                TaskReviewService.getConfig(projectId, userId),
                "Code Insight configuration retrieved"));
    }

    // Update repository config and review rules; service layer restricts this to project leaders.
    @PutMapping("/config")
    @PreAuthorizeProjectLeader
    public ResponseEntity<ApiResponse<CodeInsightConfigResponse>> updateConfig(
            @PathVariable Long projectId,
            @RequestBody CodeInsightConfigRequest request,
            HttpSession session) {
        // The request body is passed to the service so URL parsing and secret hashing stay out of the controller.
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                TaskReviewService.updateConfig(projectId, request, userId),
                "Code Insight configuration updated"));
    }

    // Load tasks currently waiting for leader review in the Code Insight queue.
    @GetMapping("/review-queue")
    public ResponseEntity<ApiResponse<List<TaskReviewDecisionResponse>>> getReviewQueue(
            @PathVariable Long projectId,
            HttpSession session) {
        // The service returns review decisions plus compact task metadata for the queue UI.
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                taskService.getProjectReviewQueue(projectId, userId),
                "Code Insight review queue retrieved"));
    }

    // Read leader/mentor dashboard counts derived from current task and evidence state.
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<TaskReviewDashboardResponse>> getDashboard(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                TaskReviewService.getDashboard(projectId, userId),
                "Code Insight dashboard retrieved"));
    }

    // Load linked GitHub issue/PR/commit/CI evidence for one task.
    @GetMapping("/tasks/{taskId}/evidence")
    public ResponseEntity<ApiResponse<TaskEvidenceResponse>> getTaskEvidence(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                TaskReviewService.getTaskEvidence(projectId, taskId, userId),
                "Code Insight task evidence retrieved"));
    }

    @GetMapping("/tasks/{taskId}/review-detail")
    public ResponseEntity<ApiResponse<TaskReviewDetailResponse>> getReviewDetail(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                TaskReviewService.getReviewDetail(projectId, taskId, userId),
                "Code Insight review detail retrieved"));
    }

    // Fetch changed files from GitHub on demand; this is a POST because it writes cache rows.
    @PostMapping("/tasks/{taskId}/evidence/fetch-files")
    public ResponseEntity<ApiResponse<TaskEvidenceResponse>> fetchTaskChangedFiles(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                TaskReviewService.fetchTaskChangedFiles(projectId, taskId, userId),
                "Code Insight changed files fetched"));
    }

    // Create a structured AI-assisted recommendation for the leader; it never approves automatically.
    @PostMapping("/tasks/{taskId}/ai-review")
    public ResponseEntity<ApiResponse<CodeInsightAiReviewResponse>> createAiReview(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                TaskReviewService.createAiReview(projectId, taskId, userId),
                "Code Insight AI review created"));
    }

    @GetMapping("/tasks/{taskId}/manual-links")
    public ResponseEntity<ApiResponse<List<ManualEvidenceLinkResponse>>> listManualLinks(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                manualEvidenceLinkService.list(projectId, taskId, userId),
                "Manual evidence links retrieved"));
    }

    @PostMapping("/tasks/{taskId}/manual-links")
    public ResponseEntity<ApiResponse<ManualEvidenceLinkResponse>> suggestManualLink(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestBody ManualEvidenceLinkRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                manualEvidenceLinkService.suggest(projectId, taskId, request, userId),
                "Manual evidence link suggested"));
    }

    @PostMapping("/tasks/{taskId}/manual-links/{linkId}/confirm")
    @PreAuthorizeProjectLeader
    public ResponseEntity<ApiResponse<ManualEvidenceLinkResponse>> confirmManualLink(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @PathVariable Long linkId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                manualEvidenceLinkService.confirm(projectId, taskId, linkId, userId),
                "Manual evidence link confirmed"));
    }

    @PostMapping("/tasks/{taskId}/manual-links/{linkId}/reject")
    @PreAuthorizeProjectLeader
    public ResponseEntity<ApiResponse<ManualEvidenceLinkResponse>> rejectManualLink(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @PathVariable Long linkId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                manualEvidenceLinkService.reject(projectId, taskId, linkId, userId),
                "Manual evidence link rejected"));
    }

    @GetMapping("/evidence/search")
    public ResponseEntity<ApiResponse<EvidenceSearchResponse>> searchEvidence(
            @PathVariable Long projectId,
            @RequestParam String type,
            @RequestParam(required = false) String query,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                manualEvidenceLinkService.search(projectId, type, query, userId),
                "Code Insight evidence search completed"));
    }

    // Common session guard for all Code Insight endpoints.
    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
