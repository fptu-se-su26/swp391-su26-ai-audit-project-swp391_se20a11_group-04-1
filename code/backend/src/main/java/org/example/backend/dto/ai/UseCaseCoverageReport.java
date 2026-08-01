package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class UseCaseCoverageReport {
    private Double requirementCoveragePercent;
    private Double acceptanceCriteriaCoveragePercent;
    private Double actorGoalCoveragePercent;

    private List<Long> uncoveredRequirementIds;
    private List<String> uncoveredAcceptanceCriteria;
    private List<String> uncoveredGoalIds;
    
    private List<String> useCasesWithNoActor;
    private List<String> actorsWithNoUseCase;
}
