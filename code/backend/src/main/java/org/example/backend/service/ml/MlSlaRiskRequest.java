package org.example.backend.service.ml;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MlSlaRiskRequest {

    @JsonProperty("deadline_penalty")
    private double deadlinePenalty;

    @JsonProperty("burn_rate_penalty")
    private double burnRatePenalty;

    @JsonProperty("blocker_penalty")
    private double blockerPenalty;

    @JsonProperty("workload_penalty")
    private double workloadPenalty;

    @JsonProperty("burn_gap")
    private double burnGap;

    @JsonProperty("spi")
    private double spi;

    @JsonProperty("days_until_deadline")
    private double daysUntilDeadline;

    @JsonProperty("overdue_days")
    private double overdueDays;

    @JsonProperty("estimated_hours")
    private double estimatedHours;

    @JsonProperty("weight")
    private double weight;

    @JsonProperty("priority_encoded")
    private int priorityEncoded;

    @JsonProperty("task_type_encoded")
    private int taskTypeEncoded;
}
