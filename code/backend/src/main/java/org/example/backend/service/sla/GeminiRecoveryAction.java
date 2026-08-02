package org.example.backend.service.sla;

import lombok.Data;

import java.util.List;

@Data
public class GeminiRecoveryAction {
    private String actionType;
    private String priority;
    private String message;
    private List<String> checklistItems;
    private Long recommendedAssigneeId;
    private String recommendedAssigneeName;
    private String recommendedReason;
    private List<String> notRecommendedAssignees;
}
