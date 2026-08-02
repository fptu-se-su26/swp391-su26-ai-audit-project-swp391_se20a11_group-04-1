package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class UseCaseGenerationPayload {
    private String schemaVersion; // "2.0"
    private String generationMode; // "MODULE" or "PROJECT"
    private String promptVersion; // "module-use-case-v2"

    private Map<String, Object> module; // Target module details
    private List<GeneratedModuleDraft> modules;
    private List<DiscoveredActor> existingActorsUsed;
    private List<DiscoveredActor> proposedActors;
    private List<ActorGoal> actorGoalMatrix;
    private List<GeneratedUseCaseDraft> useCases;

    private UseCaseCoverageReport coverage;
    private List<ModuleCoverageReport> moduleCoverage;
    private UseCaseValidationResult validationSummary;
    private List<String> warnings;
}
