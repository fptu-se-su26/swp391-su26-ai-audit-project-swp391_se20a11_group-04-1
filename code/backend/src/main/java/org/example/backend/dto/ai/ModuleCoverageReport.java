package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class ModuleCoverageReport {
    private String moduleRef;
    private Double requirementCoveragePercent;
    private Double acceptanceCriteriaCoveragePercent;
    private Double actorGoalCoveragePercent;

    private List<Long> uncoveredRequirementIds;
    private List<String> uncoveredAcceptanceCriteria;
    private List<String> uncoveredGoalIds;
}
