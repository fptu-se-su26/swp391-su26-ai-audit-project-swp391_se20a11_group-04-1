package org.example.backend.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "task_votes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskVote {
    @Id
    private String id;
    private Long taskId;
    private Long userId;
    private boolean isUpvote; // true = upvote, false = downvote

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
