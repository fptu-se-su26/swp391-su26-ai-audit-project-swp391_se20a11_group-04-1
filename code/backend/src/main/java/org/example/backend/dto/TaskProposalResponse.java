package org.example.backend.dto;

import lombok.*;
import org.example.backend.entity.ProposalStatus;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full response for a task proposal including vote counts, current user vote, and comments.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskProposalResponse {
    private String id;
    private Long taskId;
    private String content;
    private ProposalStatus status;

    // Who created this proposal
    private Long createdById;
    private String createdByName;

    private LocalDateTime createdAt;

    // Vote summary
    private int upvotes;
    private int downvotes;

    // Current authenticated user's vote: "UP", "DOWN", or null
    private String myVote;

    private List<TaskProposalCommentResponse> comments;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskProposalCommentResponse {
        private String id;
        private String content;
        private Long createdById;
        private String createdByName;
        private LocalDateTime createdAt;
    }
}
