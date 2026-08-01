package org.example.backend.service.ai.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ai.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class UseCaseGenerationPayloadNormalizer {

    private final ObjectMapper objectMapper;

    @Autowired
    public UseCaseGenerationPayloadNormalizer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Normalizes any staging payload (legacy array or v2.0 object) into a consistent UseCaseGenerationPayload.
     * This ensures the frontend always consumes exactly one schema structure.
     */
    public UseCaseGenerationPayload normalize(JsonNode rawPayload) {
        if (rawPayload == null) {
            return createEmptyPayload();
        }

        try {
            // Check if it's already schema 3.0
            if (rawPayload.isObject() && rawPayload.has("schemaVersion") &&
                    "3.0".equals(rawPayload.get("schemaVersion").asText())) {
                try {
                    return objectMapper.treeToValue(rawPayload, UseCaseGenerationPayload.class);
                } catch (Exception e) {
                    throw new IllegalArgumentException("Malformed Schema 3.0 payload", e);
                }
            }

            // Check if it's already v2.0
            if (rawPayload.isObject() && rawPayload.has("schemaVersion") &&
                    "2.0".equals(rawPayload.get("schemaVersion").asText())) {
                return objectMapper.treeToValue(rawPayload, UseCaseGenerationPayload.class);
            }

            // Legacy format: raw JSON array of use cases
            if (rawPayload.isArray()) {
                return normalizeLegacyArray(rawPayload);
            }

            // Legacy format: object with a nested array
            if (rawPayload.isObject()) {
                // Look for the first array field
                Iterator<String> fieldNames = rawPayload.fieldNames();
                while (fieldNames.hasNext()) {
                    String fieldName = fieldNames.next();
                    JsonNode node = rawPayload.get(fieldName);
                    if (node.isArray()) {
                        return normalizeLegacyArray(node);
                    }
                }
            }

            return createEmptyPayload();
        } catch (Exception e) {
            log.error("Failed to normalize payload: {}", e.getMessage(), e);
            return createEmptyPayload();
        }
    }

    private UseCaseGenerationPayload normalizeLegacyArray(JsonNode arrayNode) {
        UseCaseGenerationPayload payload = new UseCaseGenerationPayload();
        payload.setSchemaVersion("2.0");
        payload.setGenerationMode("LEGACY");
        payload.setPromptVersion("legacy-v1");

        List<GeneratedUseCaseDraft> useCases = new ArrayList<>();
        Set<String> actorNames = new HashSet<>();
        int counter = 1;

        for (JsonNode ucNode : arrayNode) {
            GeneratedUseCaseDraft draft = new GeneratedUseCaseDraft();
            draft.setTemporaryId("LEGACY-UC-" + String.format("%03d", counter++));
            draft.setName(getTextSafe(ucNode, "name"));
            draft.setDescription(getTextSafe(ucNode, "description"));
            draft.setPrecondition(getTextSafe(ucNode, "precondition"));
            draft.setPostcondition(getTextSafe(ucNode, "postcondition"));
            
            String mainSuccess = getTextSafe(ucNode, "mainSuccessScenario");
            if (mainSuccess == null) mainSuccess = getTextSafe(ucNode, "mainFlow");
            draft.setMainSuccessScenario(mainSuccess);
            
            String altFlow = getTextSafe(ucNode, "alternativeFlows");
            if (altFlow == null) altFlow = getTextSafe(ucNode, "alternativeFlow");
            draft.setAlternativeFlowsText(altFlow);

            draft.setModuleName(getTextSafe(ucNode, "moduleName"));
            draft.setModulePriority(getTextSafe(ucNode, "modulePriority"));
            draft.setModuleAssignee(getTextSafe(ucNode, "moduleAssignee"));
            draft.setPrimaryActors(getTextSafe(ucNode, "primaryActors"));

            // Map actors from legacy "primaryActors" string
            String actorStr = getTextSafe(ucNode, "primaryActors");
            if (actorStr != null && !actorStr.isBlank()) {
                String[] actors = actorStr.split(",");
                List<GeneratedUseCaseActorRef> actorRefs = new ArrayList<>();
                for (String actorName : actors) {
                    String trimmed = actorName.trim();
                    actorNames.add(trimmed);
                    GeneratedUseCaseActorRef ref = new GeneratedUseCaseActorRef();
                    ref.setActorRef("LEGACY-ACTOR-" + trimmed.replaceAll("\\s+", "_").toUpperCase());
                    ref.setRole("PRIMARY");
                    actorRefs.add(ref);
                }
                draft.setActors(actorRefs);
            }

            // Map requirement IDs
            if (ucNode.has("requirementIds") && ucNode.get("requirementIds").isArray()) {
                List<Long> reqIds = new ArrayList<>();
                ucNode.get("requirementIds").forEach(n -> reqIds.add(n.asLong()));
                draft.setRequirementIds(reqIds);
            } else if (ucNode.has("requirementId") && !ucNode.get("requirementId").isNull()) {
                draft.setRequirementIds(List.of(ucNode.get("requirementId").asLong()));
            }

            // Map includes
            if (ucNode.has("includes") && ucNode.get("includes").isArray()) {
                List<String> includes = new ArrayList<>();
                ucNode.get("includes").forEach(n -> includes.add(n.asText()));
                draft.setIncludes(includes);
            } else if (ucNode.has("includesList") && ucNode.get("includesList").isArray()) {
                List<String> includes = new ArrayList<>();
                ucNode.get("includesList").forEach(n -> includes.add(n.asText()));
                draft.setIncludes(includes);
            }

            // Map extendsList
            if (ucNode.has("extendsList") && ucNode.get("extendsList").isArray()) {
                List<String> extendsList = new ArrayList<>();
                ucNode.get("extendsList").forEach(n -> extendsList.add(n.asText()));
                draft.setExtendsList(extendsList);
            }

            // Map goals from legacy module
            String moduleName = getTextSafe(ucNode, "moduleName");
            if (moduleName != null) {
                draft.setModuleId(null); // Legacy doesn't have module IDs
            }

            useCases.add(draft);
        }

        payload.setUseCases(useCases);

        // Synthesize proposed actors from discovered actor names
        List<DiscoveredActor> legacyActors = new ArrayList<>();
        for (String name : actorNames) {
            DiscoveredActor actor = new DiscoveredActor();
            actor.setTemporaryId("LEGACY-ACTOR-" + name.replaceAll("\\s+", "_").toUpperCase());
            actor.setName(name);
            legacyActors.add(actor);
        }
        payload.setExistingActorsUsed(legacyActors);
        payload.setProposedActors(new ArrayList<>());
        payload.setActorGoalMatrix(new ArrayList<>());

        return payload;
    }

    private UseCaseGenerationPayload createEmptyPayload() {
        UseCaseGenerationPayload payload = new UseCaseGenerationPayload();
        payload.setSchemaVersion("2.0");
        payload.setGenerationMode("EMPTY");
        payload.setUseCases(new ArrayList<>());
        payload.setExistingActorsUsed(new ArrayList<>());
        payload.setProposedActors(new ArrayList<>());
        payload.setActorGoalMatrix(new ArrayList<>());
        return payload;
    }

    private String getTextSafe(JsonNode node, String field) {
        return node.has(field) && !node.get(field).isNull() ? node.get(field).asText() : null;
    }
}
