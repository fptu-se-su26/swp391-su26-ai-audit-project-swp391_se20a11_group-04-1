package org.example.backend.service.sla;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AiRecoveryContext {
    private String taskTitle;
    private String taskDescription;
    private String taskType;
    private String taskPriority;
    private String taskStatus;
    private String startDate;
    private String deadline;
    private String blockedReason;
    private String estimatedHours;
    private String actualHours;
    private String githubIssueUrl;
    private List<String> currentChecklistItems;
    private List<String> openChecklistItems;
    private List<String> subTaskTitles;
    private String riskLevel;
    private List<String> categories;
    private List<String> reasons;
    private Integer slaScore;
    private long overdueDays;
    private long assigneeActiveTaskCount;
    private int previousPlanCount;
    private List<String> previousActions;
    private String previousEffectiveness;
    private Integer lastScoreBefore;
    private Integer lastScoreAfter;
    private boolean followUp;
    private List<AiRecoveryMemberCandidate> memberCandidates;
    private String aiProvider;
    private String aiModel;

    private Double remainingHours;
    private Double workingHoursUntilDeadline;
    private ChecklistCompletion checklistCompletion;
    private List<Dependency> dependencies;
    private AssigneeCapacity assigneeCapacity;
    private List<PlanOutcome> previousPlanOutcomes;
    private List<String> evidenceGaps;
    private List<String> taskFacts;

    @Data
    @Builder
    public static class ChecklistCompletion {
        private int total;
        private int done;
        private int open;
        private List<String> openItems;
    }

    @Data
    @Builder
    public static class Dependency {
        private String taskId;
        private String title;
        private String status;
        private String deadline;
        private String blockingDirection;
    }

    @Data
    @Builder
    public static class AssigneeCapacity {
        private int activeTasks;
        private int overdueTasks;
        private double remainingLoad;
        private List<CandidateCapacity> candidateCapacities;
    }

    @Data
    @Builder
    public static class CandidateCapacity {
        private String memberName;
        private int activeTasks;
        private double remainingLoad;
    }

    @Data
    @Builder
    public static class PlanOutcome {
        private List<String> actions;
        private String status;
        private Integer scoreBefore;
        private Integer scoreAfter;
        private String reasonFailed;
    }
}
