package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full response for a direct task comment including vote counts and current user's vote status.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCommentResponse {
    private String id;
    private Long taskId;
    private String content;

    // Creator details
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;

    // Vote totals
    private int upvotes;
    private int downvotes;

    // Current authenticated user's vote status: "UP", "DOWN", or null
    private String myVote;

    private List<CommentReplyResponse> replies;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentReplyResponse {
        private String id;
        private String content;
        private Long createdById;
        private String createdByName;
        private LocalDateTime createdAt;
    }
}
