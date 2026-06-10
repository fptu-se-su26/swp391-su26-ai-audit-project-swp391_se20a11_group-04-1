package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskVoteStatsResponse {
    private int upvotes;
    private int downvotes;
    private String myVote; // "UP", "DOWN", or null
}
