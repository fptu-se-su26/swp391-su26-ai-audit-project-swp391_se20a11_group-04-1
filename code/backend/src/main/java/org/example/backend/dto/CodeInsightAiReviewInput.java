package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightAiReviewInput {
    private ReviewContext reviewContext;
    private TaskInput task;
    private RequirementInput requirement;
    private RuleScoreInput ruleScore;
    private GitHubEvidenceInput githubEvidence;
    private List<ChangedFileInput> changedFiles;
    private LimitsInput limits;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ReviewContext {
        private Long projectId;
        private Long taskId;
        private LocalDateTime generatedAt;
        private String reviewPurpose;
        private String language;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TaskInput {
        private Long id;
        private String code;
        private String title;
        private String description;
        private String status;
        private String type;
        private String priority;
        private AssigneeInput assignee;
        private List<ChecklistInput> checklist;
        private List<SubtaskInput> subtasks;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AssigneeInput {
        private Long id;
        private String username;
        private String email;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ChecklistInput {
        private String content;
        private boolean done;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SubtaskInput {
        private Long id;
        private String title;
        private String status;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RequirementInput {
        private Long id;
        private String code;
        private String title;
        private String description;
        private List<String> acceptanceCriteria;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RuleScoreInput {
        private int score;
        private String riskLevel;
        private String ciStatus;
        private List<String> warnings;
        private List<String> positiveSignals;
        private List<String> scoreBreakdown;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class GitHubEvidenceInput {
        private IssueInput issue;
        private List<PullRequestInput> pullRequests;
        private List<CommitInput> commits;
        private List<CheckInput> checks;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class IssueInput {
        private Integer number;
        private String url;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PullRequestInput {
        private Long id;
        private Integer number;
        private String title;
        private String state;
        private String headBranch;
        private String headSha;
        private boolean merged;
        private String authorLogin;
        private String url;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CommitInput {
        private Long id;
        private String sha;
        private String message;
        private String branchName;
        private String authorLogin;
        private String authorEmail;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CheckInput {
        private Long id;
        private String name;
        private String eventType;
        private String status;
        private String conclusion;
        private String sha;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ChangedFileInput {
        private String file;
        private String status;
        private int additions;
        private int deletions;
        private int changes;
        private String patch;
        private boolean binary;
        private boolean patchTruncated;
        private boolean secretsRedacted;
        private String patchExcludedReason;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LimitsInput {
        private int maxFilesSent;
        private int maxPatchCharsPerFile;
        private int maxTotalPatchChars;
        private boolean binaryFilesExcluded;
        private boolean secretsRedacted;
    }
}
