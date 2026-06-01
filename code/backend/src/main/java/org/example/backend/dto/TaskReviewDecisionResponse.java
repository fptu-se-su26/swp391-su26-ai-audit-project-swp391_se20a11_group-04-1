package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskReviewDecisionResponse {
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
        private Long id;
        private String name;
        private String email;
    }
}
