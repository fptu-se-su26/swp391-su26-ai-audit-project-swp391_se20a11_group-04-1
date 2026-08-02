package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class GeneratedModuleDraft {
    private String temporaryId;
    private Long existingModuleId;
    private String name;
    private String description;
    private String priority; // HIGH, MEDIUM, LOW, CRITICAL
    private List<Long> requirementIds;
    private Double confidence;
    private String rationale;
    // Suggested member to assign (populated during AUTO_PROJECT_MODULES_ONLY)
    private Long suggestedAssigneeId;
    private String suggestedAssigneeName;
}
