package org.example.backend.service.ai.usecase;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ai.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UseCaseGenerationValidator {

    public UseCaseValidationResult validate(UseCaseGenerationPayload payload) {
        UseCaseValidationResult result = new UseCaseValidationResult();
        List<UseCaseValidationResult.ValidationError> errors = new ArrayList<>();
        List<UseCaseValidationResult.ValidationWarning> warnings = new ArrayList<>();
        boolean isBlocking = false;

        if (payload.getUseCases() == null || payload.getUseCases().isEmpty()) {
            result.setErrors(errors);
            result.setWarnings(warnings);
            result.setBlocking(false);
            return result;
        }

        // Build lookup sets
        Set<String> allTempIds = payload.getUseCases().stream()
                .map(GeneratedUseCaseDraft::getTemporaryId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> allActorRefs = new HashSet<>();
        if (payload.getExistingActorsUsed() != null) {
            payload.getExistingActorsUsed().forEach(a -> {
                if (a.getTemporaryId() != null) allActorRefs.add(a.getTemporaryId());
            });
        }
        if (payload.getProposedActors() != null) {
            payload.getProposedActors().forEach(a -> {
                if (a.getTemporaryId() != null) allActorRefs.add(a.getTemporaryId());
            });
        }

        for (GeneratedUseCaseDraft uc : payload.getUseCases()) {
            String ucRef = uc.getTemporaryId() != null ? uc.getTemporaryId() : "UNKNOWN";

            // PRIMARY_ACTOR_MISSING
            if (uc.getActors() == null || uc.getActors().isEmpty()) {
                errors.add(makeError("PRIMARY_ACTOR_MISSING",
                        "Use Case '" + uc.getName() + "' has no actors assigned.", ucRef));
            } else {
                boolean hasPrimary = uc.getActors().stream()
                        .anyMatch(a -> "PRIMARY".equalsIgnoreCase(a.getRole()));
                if (!hasPrimary) {
                    errors.add(makeError("PRIMARY_ACTOR_MISSING",
                            "Use Case '" + uc.getName() + "' has no PRIMARY actor.", ucRef));
                }

                // ACTOR_REFERENCE_NOT_FOUND
                for (GeneratedUseCaseActorRef actorRef : uc.getActors()) {
                    if (actorRef.getActorRef() != null && !allActorRefs.contains(actorRef.getActorRef())) {
                        errors.add(makeError("ACTOR_REFERENCE_NOT_FOUND",
                                "Actor ref '" + actorRef.getActorRef() + "' in UC '" + uc.getName() + "' does not match any known actor.", ucRef));
                    }
                }
            }

            // MAIN_FLOW_EMPTY
            if (uc.getMainFlow() == null || uc.getMainFlow().getSteps() == null || uc.getMainFlow().getSteps().isEmpty()) {
                errors.add(makeError("MAIN_FLOW_EMPTY",
                        "Use Case '" + uc.getName() + "' has no main flow steps.", ucRef));
            }

            // SELF_INCLUDE / INCLUDE_TARGET_NOT_FOUND
            if (uc.getIncludes() != null) {
                for (String target : uc.getIncludes()) {
                    if (target.equals(ucRef)) {
                        errors.add(makeError("SELF_INCLUDE",
                                "Use Case '" + uc.getName() + "' includes itself.", ucRef));
                    } else if (!allTempIds.contains(target)) {
                        warnings.add(makeWarning("INCLUDE_TARGET_NOT_FOUND",
                                "Include target '" + target + "' in UC '" + uc.getName() + "' not found in generated set.", ucRef));
                    }
                }
            }

            // SELF_EXTEND / EXTEND_TARGET_NOT_FOUND
            if (uc.getExtendsList() != null) {
                for (String target : uc.getExtendsList()) {
                    if (target.equals(ucRef)) {
                        errors.add(makeError("SELF_EXTEND",
                                "Use Case '" + uc.getName() + "' extends itself.", ucRef));
                    } else if (!allTempIds.contains(target)) {
                        warnings.add(makeWarning("EXTEND_TARGET_NOT_FOUND",
                                "Extend target '" + target + "' in UC '" + uc.getName() + "' not found in generated set.", ucRef));
                    }
                }
            }
        }

        // SEMANTIC_DUPLICATE detection
        Map<String, List<String>> nameMap = new HashMap<>();
        for (GeneratedUseCaseDraft uc : payload.getUseCases()) {
            String key = uc.getName() != null ? uc.getName().trim().toLowerCase() : "";
            nameMap.computeIfAbsent(key, k -> new ArrayList<>()).add(uc.getTemporaryId());
        }
        for (Map.Entry<String, List<String>> entry : nameMap.entrySet()) {
            if (entry.getValue().size() > 1) {
                warnings.add(makeWarning("SEMANTIC_DUPLICATE",
                        "Use Cases with duplicate name '" + entry.getKey() + "': " + entry.getValue(),
                        entry.getValue().get(0)));
            }
        }

        // PROPOSED_ACTOR_WITHOUT_EVIDENCE
        if (payload.getProposedActors() != null) {
            for (DiscoveredActor actor : payload.getProposedActors()) {
                if (actor.getEvidenceRequirementIds() == null || actor.getEvidenceRequirementIds().isEmpty()) {
                    warnings.add(makeWarning("PROPOSED_ACTOR_WITHOUT_EVIDENCE",
                            "Proposed actor '" + actor.getName() + "' has no evidence requirement IDs.",
                            actor.getTemporaryId()));
                }
            }
        }

        // Coverage warnings
        if (payload.getCoverage() != null) {
            if (payload.getCoverage().getUncoveredRequirementIds() != null &&
                    !payload.getCoverage().getUncoveredRequirementIds().isEmpty()) {
                warnings.add(makeWarning("FUNCTIONAL_REQUIREMENT_UNCOVERED",
                        "Uncovered functional requirements: " + payload.getCoverage().getUncoveredRequirementIds(),
                        "COVERAGE"));
            }
        }

        // Determine if blocking
        isBlocking = errors.stream().anyMatch(e ->
                "MODULE_NOT_FOUND".equals(e.getCode()) ||
                "MODULE_PROJECT_MISMATCH".equals(e.getCode()) ||
                "REQUIREMENT_NOT_FOUND".equals(e.getCode()) ||
                "REQUIREMENT_PROJECT_MISMATCH".equals(e.getCode()));

        result.setErrors(errors);
        result.setWarnings(warnings);
        result.setBlocking(isBlocking);

        return result;
    }

    private UseCaseValidationResult.ValidationError makeError(String code, String message, String targetRef) {
        UseCaseValidationResult.ValidationError error = new UseCaseValidationResult.ValidationError();
        error.setCode(code);
        error.setMessage(message);
        error.setTargetRef(targetRef);
        return error;
    }

    private UseCaseValidationResult.ValidationWarning makeWarning(String code, String message, String targetRef) {
        UseCaseValidationResult.ValidationWarning warning = new UseCaseValidationResult.ValidationWarning();
        warning.setCode(code);
        warning.setMessage(message);
        warning.setTargetRef(targetRef);
        return warning;
    }

    public void validateApproveRequest(ApproveUseCaseGenerationRequest request, UseCaseGenerationPayload originalPayload) {
        if (request.getModifiedPayload() == null) {
            throw new IllegalArgumentException("Modified payload cannot be null");
        }
        
        // Convert Object to JsonNode for processing
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.JsonNode payloadNode = mapper.valueToTree(request.getModifiedPayload());
        String schemaVersion = payloadNode.has("schemaVersion") ? payloadNode.get("schemaVersion").asText() : "2.0";
                
        if ("3.0".equals(schemaVersion)) {
            if (request.getSelectedModuleRefs() == null || request.getSelectedUseCaseIds() == null) {
                throw new IllegalArgumentException("selectedModuleRefs and selectedUseCaseIds are required for schema 3.0");
            }
        } else {
            if (request.getSelectedIndices() == null) {
                throw new IllegalArgumentException("selectedIndices is required for legacy schema");
            }
        }
        
        // Basic security check: max sizes
        if ("3.0".equals(schemaVersion)) {
            if (request.getSelectedUseCaseIds().size() > 200) {
                throw new IllegalArgumentException("Payload too large: maximum 200 use cases allowed");
            }
            if (request.getSelectedModuleRefs().size() > 50) {
                throw new IllegalArgumentException("Payload too large: maximum 50 modules allowed");
            }
        }
    }
}
