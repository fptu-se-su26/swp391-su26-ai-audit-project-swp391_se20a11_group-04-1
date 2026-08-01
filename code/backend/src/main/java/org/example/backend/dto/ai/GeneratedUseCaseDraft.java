package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class GeneratedUseCaseDraft {
    private String temporaryId; // e.g. AI-UC-001
    private String moduleRef;
    private List<String> goalIds;
    private Long moduleId;
    private String name;
    private String description;
    private List<GeneratedUseCaseActorRef> actors;
    private List<Long> requirementIds;
    private List<AcceptanceCriteriaRef> acceptanceCriteriaCoverage;
    private StructuredMainFlow mainFlow;
    private StructuredAlternativeFlow alternativeFlows;
    private List<String> includes;
    private List<String> extendsList;

    @Data
    public static class AcceptanceCriteriaRef {
        private Long requirementId;
        private Integer criterionIndex;
    }

    // Fallback/Legacy fields for V1 Payload structure compatibility
    private String moduleName;
    private String modulePriority;
    private String moduleAssignee;
    private String primaryActors;
    private String mainSuccessScenario;
    private String alternativeFlowsText;
    private String precondition;
    private String postcondition;
}
