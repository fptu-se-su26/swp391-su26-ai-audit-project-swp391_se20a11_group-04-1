package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlaReliabilityReportResponse {

    private Long projectId;
    private Long sprintId;

    // MTTR — Mean Time To Recovery (hours)
    private BigDecimal mttrHours;
    private Integer mttrSampleCount;
    private String mttrTrend; // IMPROVING | DEGRADING | STABLE | INSUFFICIENT_DATA

    // MTBF — Mean Time Between Failures (days)
    private BigDecimal mtbfDays;
    private Integer mtbfSampleCount;

    // Availability
    private BigDecimal availabilityPct;
    private Integer totalIntervals;
    private Integer healthyIntervals;
    private Integer healthyThreshold;

    // Error Budget
    private BigDecimal budgetPct;
    private Integer totalTasks;
    private Integer penalizedTasks;
    private BigDecimal errorBudgetConsumedPct;
    private BigDecimal errorBudgetRemainingPct;

    // Composite Reliability Score (0–100, derived — not persisted)
    private BigDecimal reliabilityScore;

    // Historical trend for chart (last N sprints)
    private List<SprintTrendPoint> trendHistory;

    // Gemini AI narrative (nullable)
    private String aiNarrative;

    private LocalDateTime computedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SprintTrendPoint {
        private Long sprintId;
        private String sprintName;
        private BigDecimal availabilityPct;
        private BigDecimal errorBudgetConsumedPct;
        private BigDecimal mttrHours;
        private BigDecimal reliabilityScore;
        private LocalDateTime computedAt;
    }
}
