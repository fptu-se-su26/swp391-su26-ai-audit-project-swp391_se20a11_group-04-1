package org.example.backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A checklist proposal submitted by a team member for a specific Task.
 * Mapped as a MongoDB Document instead of JPA Entity.
 */
@Document(collection = "feature_proposals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskProposal {

    @Id
    private String id;

    private Long taskId; // FK to PostgreSQL Task.id

    private String content;

    @Builder.Default
    private ProposalStatus status = ProposalStatus.PENDING;

    private Long createdById; // FK to PostgreSQL UserAccount.id
    private String createdByName; // Cached username

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Builder.Default
    private List<ProposalVote> votes = new ArrayList<>();

    @Builder.Default
    private List<ProposalComment> comments = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProposalVote {
        private Long userId; // FK to PostgreSQL UserAccount.id
        private boolean isUpvote;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProposalComment {
        private String id; // Unique ID for comment
        private String content;
        private Long createdById;
        private String createdByName;
        @Builder.Default
        private LocalDateTime createdAt = LocalDateTime.now();
    }
}
