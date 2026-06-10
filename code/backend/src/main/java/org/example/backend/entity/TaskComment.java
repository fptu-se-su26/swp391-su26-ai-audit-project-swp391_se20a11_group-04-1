package org.example.backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A comment left by a team member directly on a Task/Feature.
 * Mapped as a MongoDB Document instead of JPA Entity.
 */
@Document(collection = "task_comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskComment {

    @Id
    private String id;

    private Long taskId; // FK to PostgreSQL Task.id

    private String content;

    private Long createdById; // FK to PostgreSQL UserAccount.id
    private String createdByName; // Cached username for fast rendering

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private List<CommentVote> votes = new ArrayList<>();

    @Builder.Default
    private List<CommentReply> replies = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentVote {
        private Long userId; // FK to PostgreSQL UserAccount.id
        private boolean isUpvote;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentReply {
        private String id; // Unique UUID
        private String content;
        private Long createdById;
        private String createdByName;
        @Builder.Default
        private LocalDateTime createdAt = LocalDateTime.now();
    }
}
