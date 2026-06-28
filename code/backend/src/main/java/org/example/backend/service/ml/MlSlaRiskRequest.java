package org.example.backend.service.ml;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlSlaRiskRequest {

    // --- Group 1: Task State ---
    @JsonProperty("deadline_penalty")      private double deadlinePenalty;
    @JsonProperty("burn_rate_penalty")     private double burnRatePenalty;
    @JsonProperty("blocker_penalty")       private double blockerPenalty;
    @JsonProperty("workload_penalty")      private double workloadPenalty;
    @JsonProperty("burn_gap")              private double burnGap;
    @JsonProperty("spi")                   private double spi;
    @JsonProperty("days_until_deadline")   private double daysUntilDeadline;
    @JsonProperty("overdue_days")          private double overdueDays;
    @JsonProperty("estimated_hours")       private double estimatedHours;
    @JsonProperty("weight")                private double weight;
    @JsonProperty("priority_encoded")      private int    priorityEncoded;
    @JsonProperty("task_type_encoded")     private int    taskTypeEncoded;

    // --- Group 2: Personal + Skill ---
    @JsonProperty("lifetime_ontime_rate")        private double lifetimeOntimeRate;
    @JsonProperty("lifetime_penalty_rate")       private double lifetimePenaltyRate;
    @JsonProperty("total_sprints_participated")  private int    totalSprintsParticipated;
    @JsonProperty("ontime_rate_by_task_type")    private double ontimeRateByTaskType;
    @JsonProperty("avg_complexity_completed")    private double avgComplexityCompleted;
    @JsonProperty("complexity_gap")              private double complexityGap;
    @JsonProperty("blocker_rate")                private double blockerRate;
    @JsonProperty("stale_explanation_rate")      private double staleExplanationRate;
    @JsonProperty("recovery_success_rate")       private double recoverySuccessRate;
    @JsonProperty("is_new_member")               private int    isNewMember;

    // --- Group 3: Sprint Context ---
    @JsonProperty("sprint_progress_ratio")   private double sprintProgressRatio;
    @JsonProperty("days_to_sprint_end")      private double daysToSprintEnd;
    @JsonProperty("sprint_team_size")        private int    sprintTeamSize;
    @JsonProperty("assignee_active_tasks")   private int    assigneeActiveTasks;
    @JsonProperty("sprint_overdue_count")    private int    sprintOverdueCount;
    @JsonProperty("sprint_high_risk_count")  private int    sprintHighRiskCount;
    @JsonProperty("sprint_avg_spi")          private double sprintAvgSpi;
    @JsonProperty("team_blocker_count")      private int    teamBlockerCount;

    // --- Group 4: Activity Signal ---
    @JsonProperty("days_since_last_update")  private double daysSinceLastUpdate;
    @JsonProperty("checklist_done_pct")      private double checklistDonePct;
    @JsonProperty("has_blocker")             private int    hasBlocker;
    @JsonProperty("commits_last_7d")         private int    commitsLast7d;

    // --- Group 5: Risk History ---
    @JsonProperty("risk_escalation_count")   private int riskEscalationCount;
    @JsonProperty("previous_plan_count")     private int previousPlanCount;
    @JsonProperty("times_entered_critical")  private int timesEnteredCritical;
}
