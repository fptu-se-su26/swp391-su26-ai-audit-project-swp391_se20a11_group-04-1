package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskEvidenceResponse {
    private Long projectId;
    private TaskSummary task;
    private GithubIssueSummary githubIssue;
    private List<PullRequestEvidence> pullRequests;
    private List<CommitEvidence> commits;
    private List<CheckRunEvidence> checkRuns;
    private List<PullRequestFileEvidence> changedFiles;
    private List<ManualEvidenceLinkResponse> manualEvidenceLinks;
    private CodeInsightAiReviewResponse aiReview;
    private TaskReviewDecisionResponse.ReviewEvidenceSummary scoreSummary;
    private CodeInsightApprovalGateResponse approvalGate;
    private List<GeneralEvidenceSummary> generalEvidences;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskSummary {
        private Long id;
        private String title;
        private String status;
        private String priority;
        private String type;
        private String requirementCode;
        private String assigneeName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GithubIssueSummary {
        private Integer number;
        private String url;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PullRequestEvidence {
        private Long id;
        private Integer prNumber;
        private String title;
        private String state;
        private boolean draft;
        private String authorLogin;
        private String headBranch;
        private String baseBranch;
        private String headSha;
        private String mergeCommitSha;
        private LocalDateTime mergedAt;
        private String url;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommitEvidence {
        private Long id;
        private String sha;
        private String branchName;
        private String message;
        private String authorName;
        private String authorEmail;
        private String authorLogin;
        private LocalDateTime committedAt;
        private String url;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CheckRunEvidence {
        private Long id;
        private String externalId;
        private String sha;
        private String name;
        private String eventType;
        private String status;
        private String conclusion;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        private String url;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PullRequestFileEvidence {
        private Long id;
        private Long pullRequestId;
        private String filePath;
        private String status;
        private int additions;
        private int deletions;
        private int changes;
        private String patchHash;
        private String patchSummary;
        private LocalDateTime fetchedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GeneralEvidenceSummary {
        private Long id;
        private String title;
        private String type;
        private String fileUrl;
        private String externalUrl;
        private String status;
    }
}
