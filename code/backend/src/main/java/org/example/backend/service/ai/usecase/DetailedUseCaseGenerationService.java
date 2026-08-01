package org.example.backend.service.ai.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ai.*;
import org.example.backend.entity.Requirement;
import org.example.backend.service.AiRoutingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DetailedUseCaseGenerationService {

    private final AiRoutingService aiRoutingService;
    private final ObjectMapper objectMapper;

    @Autowired
    public DetailedUseCaseGenerationService(AiRoutingService aiRoutingService, ObjectMapper objectMapper) {
        this.aiRoutingService = aiRoutingService;
        this.objectMapper = objectMapper;
    }

    public List<GeneratedUseCaseDraft> generateForChunk(UseCaseGenerationContext context, List<ActorGoal> chunk) {
        String prompt = buildGenerationPrompt(context, chunk);
        String rawResponse = aiRoutingService.generateText(prompt);
        String cleaned = cleanJsonOutput(rawResponse);

        try {
            JsonNode root = objectMapper.readTree(cleaned);
            JsonNode useCasesNode = root.isArray() ? root :
                    (root.has("useCases") ? root.get("useCases") : root);

            List<GeneratedUseCaseDraft> drafts = new ArrayList<>();
            if (useCasesNode != null && useCasesNode.isArray()) {
                int counter = 1;
                for (JsonNode ucNode : useCasesNode) {
                    GeneratedUseCaseDraft draft = parseUseCaseDraft(ucNode, counter++);
                    if (draft != null) drafts.add(draft);
                }
            }
            return drafts;
        } catch (Exception e) {
            log.error("Failed to parse generated use cases: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    private String buildGenerationPrompt(UseCaseGenerationContext context, List<ActorGoal> goals) {
        StringBuilder sb = new StringBuilder();

        sb.append("You are a Senior Business Analyst generating detailed Use Cases.\n\n");

        // Module context
        if (context.getTargetModule() != null) {
            sb.append("MODULE: ").append(context.getTargetModule().getName()).append("\n\n");
        }

        // Actor refs
        sb.append("AVAILABLE ACTOR REFERENCES:\n");
        // We don't have the full discovery result here, but goals reference actorRefs
        goals.stream().map(ActorGoal::getActorRef).distinct().forEach(ref ->
                sb.append("  - ").append(ref).append("\n"));
        sb.append("\n");

        // Goals to generate for
        sb.append("GOALS TO GENERATE USE CASES FOR:\n");
        for (ActorGoal goal : goals) {
            sb.append("  ").append(goal.getGoalId()).append(": Actor=").append(goal.getActorRef());
            sb.append(" | Goal=\"").append(goal.getGoal()).append("\"");
            sb.append(" | RequirementIDs=").append(goal.getRequirementIds()).append("\n");
        }
        sb.append("\n");

        // Requirement details
        sb.append("REQUIREMENT DETAILS:\n");
        for (Requirement r : context.getModuleRequirements()) {
            sb.append("  REQ-").append(r.getId()).append(": ").append(r.getTitle()).append("\n");
            if (r.getDescription() != null) {
                sb.append("    ").append(r.getDescription()).append("\n");
            }
            if (r.getAcceptanceCriteria() != null && !r.getAcceptanceCriteria().equals("[]")) {
                sb.append("    AC: ").append(r.getAcceptanceCriteria()).append("\n");
            }
        }
        sb.append("\n");

        // Existing use cases
        if (context.getExistingUseCases() != null && !context.getExistingUseCases().isEmpty()) {
            sb.append("EXISTING USE CASES (DO NOT DUPLICATE):\n");
            for (var uc : context.getExistingUseCases().stream().limit(30).collect(Collectors.toList())) {
                sb.append("  - ").append(uc.getName()).append("\n");
            }
            sb.append("\n");
        }

        sb.append("For EACH goal, generate one or more detailed Use Cases.\n");
        sb.append("Return a JSON array. Each Use Case object MUST have these fields:\n");
        sb.append("{\n");
        sb.append("  \"temporaryId\": \"AI-UC-001\",\n");
        sb.append("  \"goalIds\": [\"GOAL-001\"],\n");
        sb.append("  \"name\": \"Verb + Noun format (e.g., Create Course)\",\n");
        sb.append("  \"description\": \"Brief description\",\n");
        sb.append("  \"actors\": [{ \"actorRef\": \"ACTOR-EXIST-1\", \"role\": \"PRIMARY\" }],\n");
        sb.append("  \"requirementIds\": [12],\n");
        sb.append("  \"acceptanceCriteriaCoverage\": [{ \"requirementId\": 12, \"criterionIndex\": 0 }],\n");
        sb.append("  \"precondition\": \"...\",\n");
        sb.append("  \"postcondition\": \"...\",\n");
        sb.append("  \"mainFlow\": { \"steps\": [\n");
        sb.append("    { \"step\": 1, \"actorRef\": \"ACTOR-EXIST-1\", \"actorAction\": \"...\", \"systemResponse\": \"...\" }\n");
        sb.append("  ]},\n");
        sb.append("  \"alternativeFlows\": { \"flows\": [\n");
        sb.append("    { \"id\": \"AF-1\", \"triggerStep\": 1, \"condition\": \"...\", \"steps\": [\n");
        sb.append("      { \"step\": 1, \"actorRef\": \"ACTOR-EXIST-1\", \"action\": \"...\" }\n");
        sb.append("    ]}\n");
        sb.append("  ]},\n");
        sb.append("  \"includes\": [],\n");
        sb.append("  \"extendsList\": [],\n");
        sb.append("  \"moduleName\": \"").append(context.getTargetModule() != null ? context.getTargetModule().getName() : "General").append("\"\n");
        sb.append("}\n\n");
        sb.append("RULES:\n");
        sb.append("- Generate GRANULAR, ATOMIC Use Cases. NEVER use 'Manage [Entity]'.\n");
        sb.append("- Each Use Case must have at least one PRIMARY actor.\n");
        sb.append("- MainFlow steps must be numbered and include both actor action and system response.\n");
        sb.append("- Use INCLUDE for mandatory sub-flows, EXTEND for optional/conditional flows.\n");
        sb.append("- All actorRef values must match the AVAILABLE ACTOR REFERENCES above.\n");
        sb.append("- RETURN ONLY THE JSON ARRAY. NO COMMENTS.\n");

        return sb.toString();
    }

    private GeneratedUseCaseDraft parseUseCaseDraft(JsonNode node, int counter) {
        if (node == null) return null;
        GeneratedUseCaseDraft draft = new GeneratedUseCaseDraft();

        draft.setTemporaryId(node.has("temporaryId") ? node.get("temporaryId").asText() : "AI-UC-" + String.format("%03d", counter));
        draft.setName(node.has("name") ? node.get("name").asText() : "Unnamed UC");
        draft.setDescription(node.has("description") ? node.get("description").asText() : null);

        // Goal IDs
        if (node.has("goalIds") && node.get("goalIds").isArray()) {
            List<String> goalIds = new ArrayList<>();
            node.get("goalIds").forEach(n -> goalIds.add(n.asText()));
            draft.setGoalIds(goalIds);
        }

        // Actors
        if (node.has("actors") && node.get("actors").isArray()) {
            List<GeneratedUseCaseActorRef> actors = new ArrayList<>();
            for (JsonNode actorNode : node.get("actors")) {
                GeneratedUseCaseActorRef ref = new GeneratedUseCaseActorRef();
                ref.setActorRef(actorNode.has("actorRef") ? actorNode.get("actorRef").asText() : null);
                ref.setRole(actorNode.has("role") ? actorNode.get("role").asText() : "PRIMARY");
                actors.add(ref);
            }
            draft.setActors(actors);
        } else if (node.has("primaryActors")) {
            // Backward compatibility: single string actor
            GeneratedUseCaseActorRef ref = new GeneratedUseCaseActorRef();
            ref.setActorRef(node.get("primaryActors").asText());
            ref.setRole("PRIMARY");
            draft.setActors(List.of(ref));
        }

        // Requirement IDs
        if (node.has("requirementIds") && node.get("requirementIds").isArray()) {
            List<Long> reqIds = new ArrayList<>();
            node.get("requirementIds").forEach(n -> reqIds.add(n.asLong()));
            draft.setRequirementIds(reqIds);
        }

        // AC Coverage
        if (node.has("acceptanceCriteriaCoverage") && node.get("acceptanceCriteriaCoverage").isArray()) {
            List<GeneratedUseCaseDraft.AcceptanceCriteriaRef> acRefs = new ArrayList<>();
            for (JsonNode acNode : node.get("acceptanceCriteriaCoverage")) {
                GeneratedUseCaseDraft.AcceptanceCriteriaRef acRef = new GeneratedUseCaseDraft.AcceptanceCriteriaRef();
                acRef.setRequirementId(acNode.has("requirementId") ? acNode.get("requirementId").asLong() : null);
                acRef.setCriterionIndex(acNode.has("criterionIndex") ? acNode.get("criterionIndex").asInt() : 0);
                acRefs.add(acRef);
            }
            draft.setAcceptanceCriteriaCoverage(acRefs);
        }

        // Structured Flows - parse as raw objects; store via Jackson
        try {
            if (node.has("mainFlow")) {
                draft.setMainFlow(objectMapper.treeToValue(node.get("mainFlow"), StructuredMainFlow.class));
            }
            if (node.has("alternativeFlows")) {
                draft.setAlternativeFlows(objectMapper.treeToValue(node.get("alternativeFlows"), StructuredAlternativeFlow.class));
            }
        } catch (Exception e) {
            log.warn("Failed to parse structured flows for UC {}: {}", draft.getTemporaryId(), e.getMessage());
        }

        // Includes / Extends
        if (node.has("includes") && node.get("includes").isArray()) {
            List<String> includes = new ArrayList<>();
            node.get("includes").forEach(n -> includes.add(n.asText()));
            draft.setIncludes(includes);
        }
        if (node.has("extendsList") && node.get("extendsList").isArray()) {
            List<String> extList = new ArrayList<>();
            node.get("extendsList").forEach(n -> extList.add(n.asText()));
            draft.setExtendsList(extList);
        }

        return draft;
    }

    private String cleanJsonOutput(String response) {
        if (response == null) return "[]";
        response = response.replace("\\0", "");

        int codeBlockStart = response.indexOf("```json");
        if (codeBlockStart != -1) {
            int codeBlockEnd = response.lastIndexOf("```");
            if (codeBlockEnd > codeBlockStart) {
                response = response.substring(codeBlockStart + 7, codeBlockEnd);
            }
        } else {
            codeBlockStart = response.indexOf("```");
            if (codeBlockStart != -1) {
                int codeBlockEnd = response.lastIndexOf("```");
                if (codeBlockEnd > codeBlockStart) {
                    response = response.substring(codeBlockStart + 3, codeBlockEnd);
                }
            }
        }
        response = response.trim();
        int firstBracket = response.indexOf("[");
        int lastBracket = response.lastIndexOf("]");
        int firstCurly = response.indexOf("{");
        int lastCurly = response.lastIndexOf("}");

        if (firstBracket != -1 && lastBracket > firstBracket &&
                (firstCurly == -1 || firstBracket < firstCurly)) {
            return response.substring(firstBracket, lastBracket + 1);
        }
        if (firstCurly != -1 && lastCurly > firstCurly) {
            return response.substring(firstCurly, lastCurly + 1);
        }
        return response;
    }
}
