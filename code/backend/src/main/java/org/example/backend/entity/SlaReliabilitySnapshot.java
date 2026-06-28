package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sla_reliability_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaReliabilitySnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "sprint_id", nullable = false)
    private Long sprintId;

    @Column(name = "mttr_hours", precision = 10, scale = 2)
    private BigDecimal mttrHours;

    @Column(name = "mttr_sample_count", nullable = false)
    @Builder.Default
    private int mttrSampleCount = 0;

    @Column(name = "mtbf_days", precision = 10, scale = 2)
    private BigDecimal mtbfDays;

    @Column(name = "mtbf_sample_count", nullable = false)
    @Builder.Default
    private int mtbfSampleCount = 0;

    @Column(name = "availability_pct", precision = 5, scale = 2)
    private BigDecimal availabilityPct;

    @Column(name = "healthy_threshold", nullable = false)
    @Builder.Default
    private int healthyThreshold = 75;

    @Column(name = "total_intervals", nullable = false)
    @Builder.Default
    private int totalIntervals = 0;

    @Column(name = "healthy_intervals", nullable = false)
    @Builder.Default
    private int healthyIntervals = 0;

    @Column(name = "budget_pct", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal budgetPct = BigDecimal.valueOf(10.0);

    @Column(name = "total_tasks", nullable = false)
    @Builder.Default
    private int totalTasks = 0;

    @Column(name = "penalized_tasks", nullable = false)
    @Builder.Default
    private int penalizedTasks = 0;

    @Column(name = "error_budget_consumed_pct", precision = 5, scale = 2)
    private BigDecimal errorBudgetConsumedPct;

    @Column(name = "error_budget_remaining_pct", precision = 5, scale = 2)
    private BigDecimal errorBudgetRemainingPct;

    @Column(name = "ai_narrative", columnDefinition = "TEXT")
    private String aiNarrative;

    @Column(name = "computed_at", nullable = false)
    @Builder.Default
    private LocalDateTime computedAt = LocalDateTime.now();
}
