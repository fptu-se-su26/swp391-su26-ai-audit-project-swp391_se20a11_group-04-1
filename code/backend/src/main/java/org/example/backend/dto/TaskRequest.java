package org.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class TaskRequest {
    private Long requirementId;
    @JsonIgnore
    private boolean requirementIdPresent;
    private Long sprintId;
    private String title;
    private String description;
    private String type;
    private Long primaryAssigneeId;
    private String priority;
    private LocalDate startDate;
    private LocalDate deadline;
    private BigDecimal weight;
    private BigDecimal estimatedHours;
    private String status;
    private Long columnId;
    private String blockedReason;
    private List<ChecklistItemRequest> checklist;
    private Long parentId;

    public void setRequirementId(Long requirementId) {
        this.requirementId = requirementId;
        this.requirementIdPresent = true;
    }

    @Getter
    @Setter
    public static class ChecklistItemRequest {
        private Long id;
        private String content;
        private Boolean done;
        private Integer orderIndex;
    }
}
