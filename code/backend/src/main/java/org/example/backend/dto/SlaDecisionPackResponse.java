package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlaDecisionPackResponse {
    private Long taskId;
    private Long projectId;
    private Long sprintId;
    private Long assigneeId;
    private int currentScore;
    private String currentRiskLevel;
    private List<String> slaCategories;
    private List<String> reasons;
    private String recommendedAction;
    private long overdueDays;
    private Long daysUntilDeadline;
    private boolean hasAcceptedEvidence;
    private boolean penaltyApplied;
    private double burnGap;
    private String burnRateLevel;
    private double spi;
    private String predictedRiskLevel;
    private List<String> predictionReasons;
    private ScoreBreakdown scoreBreakdown;
    private LocalDateTime evaluatedAt;
    private String latestEventType;
    private String latestActionTaken;
    private List<DecisionLogItem> recentDecisions;
    private List<ActionLogItem> recentActions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreBreakdown {
        private int deadlinePenalty;
        private int burnRatePenalty;
        private int evidencePenalty;
        private int blockerPenalty;
        private int workloadPenalty;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DecisionLogItem {
        private String eventType;
        private Integer previousScore;
        private int newScore;
        private String previousRiskLevel;
        private String newRiskLevel;
        private String actionTaken;
        private LocalDateTime evaluatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActionLogItem {
        private String actionType;
        private String slaCategory;
        private String status;
        private String message;
        private LocalDateTime createdAt;
    }
}
