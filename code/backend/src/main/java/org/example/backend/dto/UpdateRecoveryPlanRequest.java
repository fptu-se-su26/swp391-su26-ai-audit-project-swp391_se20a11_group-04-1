package org.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateRecoveryPlanRequest {
    private String summary;
    private List<ActionUpdate> actions;

    @Getter
    @Setter
    public static class ActionUpdate {
        private Long id;
        private String actionType;
        private String priority;
        private String message;
        private List<String> checklistItems;
        private Long recommendedAssigneeId;
        private String recommendedAssigneeName;
        private String recommendedReason;
        private List<String> notRecommendedAssignees;
        /** If true, this is a new action to be created (id is ignored). */
        private boolean newAction;
    }
}
