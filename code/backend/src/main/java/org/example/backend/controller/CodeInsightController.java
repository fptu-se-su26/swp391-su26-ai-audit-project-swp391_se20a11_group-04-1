package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;
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

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<CodeInsightConfigResponse>> getConfig(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                codeInsightService.getConfig(projectId, userId),
                "Code Insight configuration retrieved"));
    }

    @PutMapping("/config")
    public ResponseEntity<ApiResponse<CodeInsightConfigResponse>> updateConfig(
            @PathVariable Long projectId,
            @RequestBody CodeInsightConfigRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                codeInsightService.updateConfig(projectId, request, userId),
                "Code Insight configuration updated"));
    }

    @GetMapping("/review-queue")
    public ResponseEntity<ApiResponse<List<TaskReviewDecisionResponse>>> getReviewQueue(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                taskService.getProjectReviewQueue(projectId, userId),
                "Code Insight review queue retrieved"));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
