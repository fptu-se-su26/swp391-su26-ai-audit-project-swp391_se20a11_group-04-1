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
        private String type;
        private String requirementCode;
        private String assigneeName;
        private ReviewEvidenceSummary evidenceSummary;
        private CodeInsightApprovalGateResponse approvalGate;
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

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewEvidenceSummary {
        // Computed evidence score and signals shown on the Task Review panel.
        private int score;
        private String riskLevel;
        private String evidenceMode;
        private boolean hasGithubIssue;
        private boolean hasRequirement;
        private int checklistTotal;
        private int checklistDone;
        private int subtaskTotal;
        private int subtaskDone;
        private int commitCount;
        private int pullRequestCount;
        private int checkRunCount;
        private String ciStatus;
        private boolean hasMergedPullRequest;
        private java.util.List<String> scoreBreakdown;
        private java.util.List<String> positiveSignals;
        private java.util.List<String> warnings;
        private int manualEvidenceConfirmedCount;
        private int manualEvidencePendingCount;
    }
}
