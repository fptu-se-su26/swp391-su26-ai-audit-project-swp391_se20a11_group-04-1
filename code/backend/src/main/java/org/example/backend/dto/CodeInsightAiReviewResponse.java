package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightAiReviewResponse {
    private Long id;
    private String provider;
    private String model;
    private String recommendation;
    private double confidence;
    private int scoreAdjustment;
    private String summary;
    private List<RiskDetail> riskDetails;
    private List<String> questionsForLeader;
    private EvidenceAssessment evidenceAssessment;
    private List<ReviewNote> reviewNotes;
    private Map<String, Object> providerError;
    private boolean legacy;
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RiskDetail {
        private String severity;
        private String category;
        private String title;
        private String detail;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EvidenceAssessment {
        private boolean requirementLinked;
        private boolean githubIssueLinked;
        private boolean hasCommitEvidence;
        private boolean hasPullRequestEvidence;
        private boolean ciPassed;
        private boolean authorMatchesAssignee;
        private int changedFilesReviewed;
        private int binaryFilesSkipped;
        private int truncatedFiles;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewNote {
        private String file;
        private String severity;
        private String lineHint;
        private String message;
    }
}
