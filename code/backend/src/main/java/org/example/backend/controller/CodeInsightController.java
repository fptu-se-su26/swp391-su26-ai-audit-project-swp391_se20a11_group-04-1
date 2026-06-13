package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;
import org.example.backend.dto.CodeInsightDashboardResponse;
import org.example.backend.dto.CodeInsightEvidenceSearchResponse;
import org.example.backend.dto.CodeInsightManualEvidenceLinkRequest;
import org.example.backend.dto.CodeInsightManualEvidenceLinkResponse;
import org.example.backend.dto.CodeInsightReviewDetailResponse;
import org.example.backend.dto.CodeInsightTaskEvidenceResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.CodeInsightManualEvidenceLinkService;
import org.example.backend.service.CodeInsightService;
import org.example.backend.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/code-insight")
@RequiredArgsConstructor
public class CodeInsightController {

    private final TaskService taskService;
    private final CodeInsightService codeInsightService;
    private final CodeInsightManualEvidenceLinkService manualEvidenceLinkService;

    // Read the current GitHub repository and Code Insight rule settings for this project.
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<CodeInsightConfigResponse>> getConfig(
            @PathVariable Long projectId,
            HttpSession session) {
        // Pull userId from HTTP session because project authorization is session based in this app.
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                codeInsightService.getConfig(projectId, userId),
                "Code Insight configuration retrieved"));
    }

    // Update repository config and review rules; service layer restricts this to project leaders.
    @PutMapping("/config")
    public ResponseEntity<ApiResponse<CodeInsightConfigResponse>> updateConfig(
            @PathVariable Long projectId,
            @RequestBody CodeInsightConfigRequest request,
            HttpSession session) {
        // The request body is passed to the service so URL parsing and secret hashing stay out of the controller.
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                codeInsightService.updateConfig(projectId, request, userId),
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
    public ResponseEntity<ApiResponse<CodeInsightDashboardResponse>> getDashboard(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                codeInsightService.getDashboard(projectId, userId),
                "Code Insight dashboard retrieved"));
    }

    // Load linked GitHub issue/PR/commit/CI evidence for one task.
    @GetMapping("/tasks/{taskId}/evidence")
    public ResponseEntity<ApiResponse<CodeInsightTaskEvidenceResponse>> getTaskEvidence(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                codeInsightService.getTaskEvidence(projectId, taskId, userId),
                "Code Insight task evidence retrieved"));
    }

    @GetMapping("/tasks/{taskId}/review-detail")
    public ResponseEntity<ApiResponse<CodeInsightReviewDetailResponse>> getReviewDetail(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                codeInsightService.getReviewDetail(projectId, taskId, userId),
                "Code Insight review detail retrieved"));
    }

    // Fetch changed files from GitHub on demand; this is a POST because it writes cache rows.
    @PostMapping("/tasks/{taskId}/evidence/fetch-files")
    public ResponseEntity<ApiResponse<CodeInsightTaskEvidenceResponse>> fetchTaskChangedFiles(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                codeInsightService.fetchTaskChangedFiles(projectId, taskId, userId),
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
                codeInsightService.createAiReview(projectId, taskId, userId),
                "Code Insight AI review created"));
    }

    @GetMapping("/tasks/{taskId}/manual-links")
    public ResponseEntity<ApiResponse<List<CodeInsightManualEvidenceLinkResponse>>> listManualLinks(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                manualEvidenceLinkService.list(projectId, taskId, userId),
                "Manual evidence links retrieved"));
    }

    @PostMapping("/tasks/{taskId}/manual-links")
    public ResponseEntity<ApiResponse<CodeInsightManualEvidenceLinkResponse>> suggestManualLink(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestBody CodeInsightManualEvidenceLinkRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                manualEvidenceLinkService.suggest(projectId, taskId, request, userId),
                "Manual evidence link suggested"));
    }

    @PostMapping("/tasks/{taskId}/manual-links/{linkId}/confirm")
    public ResponseEntity<ApiResponse<CodeInsightManualEvidenceLinkResponse>> confirmManualLink(
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
    public ResponseEntity<ApiResponse<CodeInsightManualEvidenceLinkResponse>> rejectManualLink(
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
    public ResponseEntity<ApiResponse<CodeInsightEvidenceSearchResponse>> searchEvidence(
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
