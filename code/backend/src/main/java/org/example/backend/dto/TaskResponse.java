package org.example.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {
    private Long id;
    private Long projectId;
    private Long requirementId;
    private String requirementCode;
    private Long sprintId;
    private String sprintName;
    private String title;
    private String description;
    private String type;
    private UserSummary primaryAssignee;
    private String priority;
    private LocalDate startDate;
    private LocalDate deadline;
    private LocalDate sprintPlanDate;
    private BigDecimal weight;
    private BigDecimal estimatedHours;
    private String status;
    private Long columnId;
    private String columnName;
    private String blockedReason;
    private boolean overduePenaltyApplied;
    private LocalDateTime overduePenaltyAppliedAt;
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ChecklistItem> checklist;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChecklistItem {
        private Long id;
        private String content;
        private boolean done;
        private int orderIndex;
    }
}
