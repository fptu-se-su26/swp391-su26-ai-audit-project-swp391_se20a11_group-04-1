package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TaskCommentResponse;
import org.example.backend.dto.TaskVoteStatsResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service handling operations for direct Task Comments and votes.
 * Integrates with MongoDB.
 */
@Service
@RequiredArgsConstructor
public class TaskCommentService {

    private final TaskCommentRepository commentRepo;
    private final TaskRepository taskRepo;
    private final UserAccountRepository userRepo;
    private final TaskVoteRepository taskVoteRepo;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TaskCommentService.class);

    private void broadcastCommentEvent(String type, Long taskId, TaskCommentResponse response) {
        try {
            java.util.Map<String, Object> payload = java.util.Map.of(
                "type", type,
                "taskId", taskId,
                "comment", response
            );
            String json = objectMapper.writeValueAsString(payload);
            org.example.backend.config.NotificationWebSocketHandler.broadcast(json);
        } catch (Exception e) {
            log.error("Failed to broadcast comment event via WebSocket: {}", e.getMessage(), e);
        }
    }

    // ─── GET Task Vote Stats ──────────────────────────────────────────────────
    public TaskVoteStatsResponse getTaskVoteStats(Long taskId, Long currentUserId) {
        long upvotes = taskVoteRepo.countByTaskIdAndIsUpvote(taskId, true);
        long downvotes = taskVoteRepo.countByTaskIdAndIsUpvote(taskId, false);
        String myVote = null;
        if (currentUserId != null) {
            Optional<TaskVote> existing = taskVoteRepo.findByTaskIdAndUserId(taskId, currentUserId);
            if (existing.isPresent()) {
                myVote = existing.get().isUpvote() ? "UP" : "DOWN";
            }
        }
        return TaskVoteStatsResponse.builder()
                .upvotes((int) upvotes)
                .downvotes((int) downvotes)
                .myVote(myVote)
                .build();
    }

    // ─── POST Vote Task ──────────────────────────────────────────────────────
    public TaskVoteStatsResponse voteTask(Long taskId, boolean isUpvote, Long currentUserId) {
        taskRepo.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));
        userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        Optional<TaskVote> existing = taskVoteRepo.findByTaskIdAndUserId(taskId, currentUserId);
        if (existing.isPresent()) {
            TaskVote vote = existing.get();
            if (vote.isUpvote() == isUpvote) {
                taskVoteRepo.delete(vote);
            } else {
                vote.setUpvote(isUpvote);
                taskVoteRepo.save(vote);
            }
        } else {
            TaskVote newVote = TaskVote.builder()
                    .taskId(taskId)
                    .userId(currentUserId)
                    .isUpvote(isUpvote)
                    .build();
            taskVoteRepo.save(newVote);
        }
        return getTaskVoteStats(taskId, currentUserId);
    }

    // ─── GET Comments ────────────────────────────────────────────────────────
    public List<TaskCommentResponse> getCommentsByTask(Long taskId, Long currentUserId) {
        return commentRepo.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(c -> toResponse(c, currentUserId))
                .collect(Collectors.toList());
    }

    // ─── POST Comment ────────────────────────────────────────────────────────
    public TaskCommentResponse addComment(Long taskId, String content, Long currentUserId) {
        taskRepo.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));
        UserAccount author = userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        String creatorName = author.getProfile() != null
                ? author.getProfile().getFullName()
                : author.getUsername();

        TaskComment comment = TaskComment.builder()
                .taskId(taskId)
                .content(content.trim())
                .createdById(currentUserId)
                .createdByName(creatorName)
                .build();

        commentRepo.save(comment);
        TaskCommentResponse response = toResponse(comment, currentUserId);
        broadcastCommentEvent("NEW_COMMENT", taskId, response);
        return response;
    }

    // ─── POST Vote ───────────────────────────────────────────────────────────
    public TaskCommentResponse vote(String commentId, boolean isUpvote, Long currentUserId) {
        TaskComment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        Optional<TaskComment.CommentVote> existing = comment.getVotes().stream()
                .filter(v -> v.getUserId().equals(currentUserId))
                .findFirst();

        if (existing.isPresent()) {
            TaskComment.CommentVote vote = existing.get();
            if (vote.isUpvote() == isUpvote) {
                // Undo vote
                comment.getVotes().remove(vote);
            } else {
                // Switch vote direction
                vote.setUpvote(isUpvote);
            }
        } else {
            // Create new vote
            TaskComment.CommentVote newVote = TaskComment.CommentVote.builder()
                    .userId(currentUserId)
                    .isUpvote(isUpvote)
                    .build();
            comment.getVotes().add(newVote);
        }

        commentRepo.save(comment);
        TaskCommentResponse response = toResponse(comment, currentUserId);
        broadcastCommentEvent("UPDATE_COMMENT", comment.getTaskId(), response);
        return response;
    }

    // ─── POST Reply ──────────────────────────────────────────────────────────
    public TaskCommentResponse addReply(String commentId, String content, Long currentUserId) {
        TaskComment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        UserAccount author = userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        String creatorName = author.getProfile() != null
                ? author.getProfile().getFullName()
                : author.getUsername();

        TaskComment.CommentReply reply = TaskComment.CommentReply.builder()
                .id(UUID.randomUUID().toString())
                .content(content.trim())
                .createdById(currentUserId)
                .createdByName(creatorName)
                .build();

        if (comment.getReplies() == null) {
            comment.setReplies(new ArrayList<>());
        }
        comment.getReplies().add(reply);
        commentRepo.save(comment);

        TaskCommentResponse response = toResponse(comment, currentUserId);
        broadcastCommentEvent("UPDATE_COMMENT", comment.getTaskId(), response);
        return response;
    }

    // ─── DTO Mapper ──────────────────────────────────────────────────────────
    private TaskCommentResponse toResponse(TaskComment c, Long currentUserId) {
        long up = c.getVotes().stream().filter(TaskComment.CommentVote::isUpvote).count();
        long down = c.getVotes().stream().filter(v -> !v.isUpvote()).count();

        String myVote = null;
        if (currentUserId != null) {
            myVote = c.getVotes().stream()
                    .filter(v -> v.getUserId().equals(currentUserId))
                    .map(v -> v.isUpvote() ? "UP" : "DOWN")
                    .findFirst()
                    .orElse(null);
        }

        List<TaskCommentResponse.CommentReplyResponse> replyDtos = c.getReplies() != null
                ? c.getReplies().stream()
                        .map(r -> TaskCommentResponse.CommentReplyResponse.builder()
                                .id(r.getId())
                                .content(r.getContent())
                                .createdById(r.getCreatedById())
                                .createdByName(r.getCreatedByName())
                                .createdAt(r.getCreatedAt())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        return TaskCommentResponse.builder()
                .id(c.getId())
                .taskId(c.getTaskId())
                .content(c.getContent())
                .createdById(c.getCreatedById())
                .createdByName(c.getCreatedByName())
                .createdAt(c.getCreatedAt())
                .upvotes((int) up)
                .downvotes((int) down)
                .myVote(myVote)
                .replies(replyDtos)
                .build();
    }
}
