package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskReviewDecisionResponse {
    // Review queue/history item returned to Code Insight UI.
    private Long id;
    private String decision;
    private String fromStatus;
    private String toStatus;
    private String reason;
    private LocalDateTime createdAt;
    private TaskSummary task;
    private UserSummary reviewer;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskSummary {
        // Compact task data so review queue can display and link to task detail.
        private Long id;
        private Long projectId;
        private String title;
        private String status;
        private String priority;
        private String requirementCode;
        private String assigneeName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        // Reviewer/requester identity shown beside the decision reason.
        private Long id;
        private String name;
        private String email;
    }
}
