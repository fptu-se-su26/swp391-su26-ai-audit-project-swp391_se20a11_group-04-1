package org.example.backend.service.sla;

import lombok.Data;

import java.util.List;

@Data
public class AiRecoveryAction {
    private String actionType;
    private String actionDetails;
    private String rationale;
    private String priority;
    private List<String> checklistItems;
    private Long recommendedAssigneeId;
    private String recommendedAssigneeName;
}
