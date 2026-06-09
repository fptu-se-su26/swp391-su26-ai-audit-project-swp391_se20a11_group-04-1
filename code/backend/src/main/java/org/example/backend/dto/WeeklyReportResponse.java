package org.example.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyReportResponse {
    private Long id;
    private Long projectId;
    private String projectName;
    private Long sprintId;
    private String sprintName;
    private LocalDate reportWeekStart;
    private LocalDate reportWeekEnd;
    private String status;
    private int redMemberCount;
    private int totalOverdueTasks;
    private int totalPenalizedTasks;
    private String summary;
    private LocalDateTime generatedAt;
    private String generatedBy;
    private List<MemberRisk> members;
    private DecisionPack decisionPack;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberRisk {
        private Long userId;
        private String name;
        private String email;
        private int overdueTaskCount;
        private int frozenTaskCount;
        private int penalizedTaskCount;
        private int staleExplanationCount;
        private String riskLevel;
        private String reason;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DecisionPack {
        private String overallRiskLevel;
        private Integer riskScore;
        private List<String> mainReasons;
        private List<String> recommendedActions;
        private List<RiskTaskDecision> riskTasks;
        private List<MemberDecision> memberDecisions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RiskTaskDecision {
        private Long taskId;
        private String title;
        private Long assigneeId;
        private String assigneeName;
        private String status;
        private String priority;
        private LocalDate deadline;
        private Long requirementId;
        private String requirementCode;
        private List<String> slaCategories;
        private Long overdueDays;
        private Boolean hasAcceptedEvidence;
        private Boolean overduePenaltyApplied;
        private String riskLevel;
        private List<String> reasons;
        private String recommendedAction;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberDecision {
        private Long userId;
        private String name;
        private String email;
        private String riskLevel;
        private Integer riskTaskCount;
        private Integer overdueTaskCount;
        private Integer penalizedTaskCount;
        private List<String> reasons;
        private String recommendedAction;
    }
}
