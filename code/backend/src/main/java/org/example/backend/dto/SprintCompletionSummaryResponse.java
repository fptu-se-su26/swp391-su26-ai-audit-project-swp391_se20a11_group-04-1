package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;
import org.example.backend.entity.SprintMemberSummary;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SprintCompletionSummaryResponse {
    private Long id;
    private Long sprintId;
    private Long projectId;
    private int totalTasks;
    private int completedTasks;
    private int completedOnTime;
    private int overdueTasks;
    private int penalizedTasks;
    private BigDecimal completionRate;
    private BigDecimal onTimeRate;
    private String aiSprintNarrative;
    private String criteriaJson;
    private List<SprintMemberSummary> memberSummaries;
    private LocalDateTime generatedAt;
    private String generatedBy;
}
