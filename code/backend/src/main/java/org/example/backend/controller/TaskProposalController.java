package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.TaskProposalResponse;
import org.example.backend.service.impl.TaskProposalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints for the Task Proposal Discussion system.
 *
 * Base URL: /api/v1/tasks/{taskId}/proposals
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TaskProposalController {

    private final TaskProposalService proposalService;

    // ─── GET proposals for a task ───────────────────────────────────────────
    @GetMapping("/tasks/{taskId}/proposals")
    public ResponseEntity<ApiResponse<List<TaskProposalResponse>>> getProposals(
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        List<TaskProposalResponse> result = proposalService.getProposalsByTask(taskId, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Proposals retrieved"));
    }

    // ─── POST create proposal ───────────────────────────────────────────────
    @PostMapping("/tasks/{taskId}/proposals")
    public ResponseEntity<ApiResponse<TaskProposalResponse>> createProposal(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        Long userId = requireUser(session);
        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Proposal content must not be empty"));
        }
        TaskProposalResponse result = proposalService.createProposal(taskId, content, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Proposal created"));
    }

    // ─── POST vote (upvote or downvote) ─────────────────────────────────────
    @PostMapping("/proposals/{proposalId}/vote")
    public ResponseEntity<ApiResponse<TaskProposalResponse>> vote(
            @PathVariable String proposalId,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        Long userId = requireUser(session);
        boolean isUpvote = Boolean.TRUE.equals(body.get("upvote"));
        TaskProposalResponse result = proposalService.vote(proposalId, isUpvote, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Vote recorded"));
    }

    // ─── POST add comment ────────────────────────────────────────────────────
    @PostMapping("/proposals/{proposalId}/comments")
    public ResponseEntity<ApiResponse<TaskProposalResponse>> addComment(
            @PathVariable String proposalId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        Long userId = requireUser(session);
        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Comment content must not be empty"));
        }
        TaskProposalResponse result = proposalService.addComment(proposalId, content, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Comment added"));
    }

    // ─── PATCH approve ───────────────────────────────────────────────────────
    @PatchMapping("/proposals/{proposalId}/approve")
    public ResponseEntity<ApiResponse<TaskProposalResponse>> approve(
            @PathVariable String proposalId,
            HttpSession session) {
        Long userId = requireUser(session);
        TaskProposalResponse result = proposalService.approveProposal(proposalId, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Proposal approved and added to checklist"));
    }

    // ─── PATCH reject ────────────────────────────────────────────────────────
    @PatchMapping("/proposals/{proposalId}/reject")
    public ResponseEntity<ApiResponse<TaskProposalResponse>> reject(
            @PathVariable String proposalId,
            HttpSession session) {
        Long userId = requireUser(session);
        TaskProposalResponse result = proposalService.rejectProposal(proposalId, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Proposal rejected"));
    }

    // ─── Helper ──────────────────────────────────────────────────────────────
    private Long requireUser(HttpSession session) {
        Object uid = session.getAttribute("userId");
        if (uid == null) throw new org.example.backend.exception.CustomException(
                "Not authenticated", org.springframework.http.HttpStatus.UNAUTHORIZED);
        return Long.parseLong(uid.toString());
    }
}
