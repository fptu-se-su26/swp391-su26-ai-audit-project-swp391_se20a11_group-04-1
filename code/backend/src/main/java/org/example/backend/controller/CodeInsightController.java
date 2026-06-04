package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;
import org.example.backend.dto.CodeInsightTaskEvidenceResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.exception.CustomException;
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

    // Common session guard for all Code Insight endpoints.
    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
