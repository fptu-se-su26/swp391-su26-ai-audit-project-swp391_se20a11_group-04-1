package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.TaskCommentResponse;
import org.example.backend.service.impl.TaskCommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for direct task comments and voting system.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TaskCommentController {

    private final TaskCommentService commentService;

    // ─── GET Task Votes ──────────────────────────────────────────────────────
    @GetMapping("/tasks/{taskId}/votes")
    public ResponseEntity<ApiResponse<org.example.backend.dto.TaskVoteStatsResponse>> getTaskVotes(
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        org.example.backend.dto.TaskVoteStatsResponse result = commentService.getTaskVoteStats(taskId, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Task votes retrieved"));
    }

    // ─── POST Vote Task ──────────────────────────────────────────────────────
    @PostMapping("/tasks/{taskId}/vote")
    public ResponseEntity<ApiResponse<org.example.backend.dto.TaskVoteStatsResponse>> voteTask(
            @PathVariable Long taskId,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        Long userId = requireUser(session);
        boolean isUpvote = Boolean.TRUE.equals(body.get("upvote"));
        org.example.backend.dto.TaskVoteStatsResponse result = commentService.voteTask(taskId, isUpvote, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Task vote recorded"));
    }

    // ─── GET Comments ────────────────────────────────────────────────────────
    @GetMapping("/tasks/{taskId}/comments")
    public ResponseEntity<ApiResponse<List<TaskCommentResponse>>> getComments(
            @PathVariable Long taskId,
            HttpSession session) {
        Long userId = requireUser(session);
        List<TaskCommentResponse> result = commentService.getCommentsByTask(taskId, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Comments retrieved"));
    }

    // ─── POST Add Comment ────────────────────────────────────────────────────
    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<ApiResponse<TaskCommentResponse>> addComment(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        Long userId = requireUser(session);
        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Comment content must not be empty"));
        }
        TaskCommentResponse result = commentService.addComment(taskId, content, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Comment added"));
    }

    // ─── POST Vote ───────────────────────────────────────────────────────────
    @PostMapping("/comments/{commentId}/vote")
    public ResponseEntity<ApiResponse<TaskCommentResponse>> vote(
            @PathVariable String commentId,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        Long userId = requireUser(session);
        boolean isUpvote = Boolean.TRUE.equals(body.get("upvote"));
        TaskCommentResponse result = commentService.vote(commentId, isUpvote, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Vote recorded"));
    }

    // ─── POST Reply ──────────────────────────────────────────────────────────
    @PostMapping("/comments/{commentId}/replies")
    public ResponseEntity<ApiResponse<TaskCommentResponse>> addReply(
            @PathVariable String commentId,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        Long userId = requireUser(session);
        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Reply content must not be empty"));
        }
        TaskCommentResponse result = commentService.addReply(commentId, content, userId);
        return ResponseEntity.ok(ApiResponse.success(result, "Reply added"));
    }

    // ─── Helper ──────────────────────────────────────────────────────────────
    private Long requireUser(HttpSession session) {
        Object uid = session.getAttribute("userId");
        if (uid == null) throw new org.example.backend.exception.CustomException(
                "Not authenticated", org.springframework.http.HttpStatus.UNAUTHORIZED);
        return Long.parseLong(uid.toString());
    }
}
