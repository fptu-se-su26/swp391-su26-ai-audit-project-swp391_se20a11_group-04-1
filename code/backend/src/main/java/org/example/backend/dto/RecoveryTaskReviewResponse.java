package org.example.backend.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class RecoveryTaskReviewResponse {
    private Long taskId;
    private Long projectId;
    private Long sprintId;
    private String taskTitle;
    private String taskStatus;
    private String priority;
    private LocalDate deadline;
    private Long assigneeId;
    private String assigneeName;
    private String riskLevel;
    private Integer slaScore;
    private Long overdueDays;
    private List<String> riskCategories;
    private List<String> reasons;
    private String recommendedAction;
    private LocalDateTime evaluatedAt;
    private RecoveryPlanResponse activePlan;
    private List<RecoveryPlanResponse> planHistory;
}
