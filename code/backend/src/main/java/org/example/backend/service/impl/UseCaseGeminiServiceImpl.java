package org.example.backend.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.service.AiRoutingService;
import org.example.backend.service.UseCaseGeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class UseCaseGeminiServiceImpl implements UseCaseGeminiService {

    private final AiRoutingService geminiService;
    // Max requirements per batch — keeps prompt under Groq 12000 TPM
    private static final int REQ_BATCH_SIZE = 3;

    @Autowired
    public UseCaseGeminiServiceImpl(AiRoutingService geminiService) {
        this.geminiService = geminiService;
    }

    @Override
    public String generateUseCasesFromRequirements(java.util.List<org.example.backend.entity.Requirement> requirements,
                                                   java.util.List<String> projectActors,
                                                   java.util.List<String> existingUseCases,
                                                   org.example.backend.entity.Project project,
                                                   java.util.List<String> projectMembersUsernames,
                                                   java.util.List<String> existingModuleNames) {
        // Split requirements into batches to stay within Groq token limit
        List<List<org.example.backend.entity.Requirement>> batches = new ArrayList<>();
        for (int i = 0; i < requirements.size(); i += REQ_BATCH_SIZE) {
            batches.add(requirements.subList(i, Math.min(i + REQ_BATCH_SIZE, requirements.size())));
        }

        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.node.ArrayNode allUseCases = om.createArrayNode();
        // Track generated UC names to avoid duplicates across batches
        List<String> cumulativeUcNames = new ArrayList<>(existingUseCases != null ? existingUseCases : new ArrayList<>());

        for (int bi = 0; bi < batches.size(); bi++) {
            List<org.example.backend.entity.Requirement> batch = batches.get(bi);
            try {
                String batchResult = generateBatch(batch, projectActors, cumulativeUcNames, project,
                        projectMembersUsernames, existingModuleNames, bi + 1, batches.size());
                String cleaned = cleanJsonOutput(batchResult);
                com.fasterxml.jackson.databind.JsonNode node = om.readTree(cleaned);
                com.fasterxml.jackson.databind.JsonNode arr = node.isArray() ? node :
                        (node.isObject() && node.has("useCases") ? node.get("useCases") : node);
                if (arr != null && arr.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode uc : arr) {
                        allUseCases.add(uc);
                        // Add to cumulative list to avoid duplicates in subsequent batches
                        if (uc.has("name")) cumulativeUcNames.add(uc.get("name").asText());
                    }
                }
            } catch (Exception e) {
                log.warn("Use case batch {}/{} failed: {}", bi + 1, batches.size(), e.getMessage());
            }
        }

        try {
            return om.writeValueAsString(allUseCases);
        } catch (Exception e) {
            return "[]";
        }
    }

    private String generateBatch(List<org.example.backend.entity.Requirement> requirements,
                                  java.util.List<String> projectActors,
                                  java.util.List<String> existingUseCases,
                                  org.example.backend.entity.Project project,
                                  java.util.List<String> projectMembersUsernames,
                                  java.util.List<String> existingModuleNames,
                                  int batchNum, int totalBatches) {
        StringBuilder reqsContext = new StringBuilder();
        for (org.example.backend.entity.Requirement r : requirements) {
            reqsContext.append("ID: ").append(r.getId()).append(" | Title: ").append(r.getTitle()).append("\n");
            reqsContext.append("Description: ").append(r.getDescription()).append("\n");
            reqsContext.append("Type: ").append(r.getType()).append("\n");
            if (r.getType() != null) {
                switch (r.getType()) {
                    case FUNCTIONAL -> reqsContext.append("Instruction: Functional. Extract all user actions and system responses as granular Use Cases.\n");
                    case NON_FUNCTIONAL -> reqsContext.append("Instruction: Non-Functional. Skip if no meaningful user-action UC can be created.\n");
                    case BUSINESS_RULE -> reqsContext.append("Instruction: Business Rule. Generate 'Validate [Rule]' UC with violation alternate flows.\n");
                    case SECURITY -> reqsContext.append("Instruction: Security. Actor must be System or Admin.\n");
                    default -> reqsContext.append("Instruction: Treat as Functional.\n");
                }
            }
            reqsContext.append("Dates: ").append(r.getStartDate()).append(" → ").append(r.getDeadline()).append("\n---\n");
        }

        String actorsContext = (projectActors != null && !projectActors.isEmpty())
                ? String.join(", ", projectActors) : "(Use standard actors)";
        String existingUcContext = (existingUseCases != null && !existingUseCases.isEmpty())
                ? String.join("\n- ", existingUseCases.subList(0, Math.min(existingUseCases.size(), 20)))
                : "(None)";
        String membersContext = (projectMembersUsernames != null && !projectMembersUsernames.isEmpty())
                ? String.join(", ", projectMembersUsernames) : "System";
        String modulesContext = (existingModuleNames != null && !existingModuleNames.isEmpty())
                ? String.join(", ", existingModuleNames) : "(None)";
        String projectDeadline = (project != null && project.getDeadline() != null) ? project.getDeadline().toString() : "N/A";
        String batchNote = totalBatches > 1 ? "NOTE: Batch " + batchNum + "/" + totalBatches + ". Generate ALL Use Cases for THESE requirements only.\n\n" : "";

        String prompt = batchNote +
                "You are a Senior Business Analyst. Analyze the requirements below and generate detailed Use Cases.\n" +
                "RULES:\n" +
                "- Generate GRANULAR, ATOMIC Use Cases. NEVER use 'Manage [Entity]'.\n" +
                "- For each entity, generate specific CRUD UCs: Create, View List, View Detail, Update, Delete.\n" +
                "- Generate implicit foundational UCs (Login, Register, Reset Password) if not in EXISTING USE CASES.\n" +
                "- Use INCLUDE for mandatory sub-flows, EXTEND for optional/alternative flows.\n" +
                "- DO NOT duplicate any UC in EXISTING USE CASES.\n" +
                "- Write everything in ENGLISH.\n\n" +
                "Return a pure JSON array. Each object MUST have ALL these fields:\n" +
                "moduleName (String, from: [" + modulesContext + "] or new if none fit), " +
                "moduleDescription (String), modulePriority ('HIGH'/'MEDIUM'/'LOW'), " +
                "moduleAssignee (from: [" + membersContext + "]), " +
                "name (String, [Verb]+[Noun] format), " +
                "primaryActors (from: [" + actorsContext + "]), " +
                "precondition (String), postcondition (String), " +
                "mainSuccessScenario (numbered steps, 1 per line), " +
                "alternativeFlows (AF[stepNum]: description\\n1. step), " +
                "requirementIds (Array of Numbers matching IDs above), " +
                "includes (Array of UC names), extendsList (Array of UC names), " +
                "startDate (YYYY-MM-DD, after " + LocalDate.now() + "), " +
                "deadline (YYYY-MM-DD, before " + projectDeadline + ").\n\n" +
                "EXISTING USE CASES (DO NOT DUPLICATE):\n- " + existingUcContext + "\n\n" +
                "ALLOWED ACTORS: " + actorsContext + "\n\n" +
                "REQUIREMENTS:\n" + reqsContext;

        return geminiService.generateText(prompt);
    }

    @Override
    public String evaluateUseCasesWithCritic(String rawUseCasesJson, java.util.List<org.example.backend.entity.Requirement> requirements, java.util.List<String> existingUseCases, java.util.List<String> allowedActors) {
        StringBuilder reqsContext = new StringBuilder();
        if (requirements != null) {
            for (org.example.backend.entity.Requirement r : requirements) {
                reqsContext.append("Requirement ID: ").append(r.getId()).append("\n");
                reqsContext.append("Title: ").append(r.getTitle()).append("\n");
                reqsContext.append("Description: ").append(r.getDescription()).append("\n");
                reqsContext.append("---\n");
            }
        }

        String existingUcsContext = existingUseCases != null && !existingUseCases.isEmpty()
                ? String.join("\n- ", existingUseCases)
                : "(No existing use cases)";

        String actorsContext = allowedActors != null && !allowedActors.isEmpty()
                ? String.join(", ", allowedActors)
                : "(No pre-defined actors. Allow any.)";

        String prompt = "You are an extremely strict Senior QA / Business Analyst (AI Critic). " +
                "I will provide you with a list of recently generated Use Cases (in JSON format), " +
                "their original parent Requirements, the list of EXISTING USE CASES in the project, and ALLOWED ACTORS.\n\n" +
                "Your task: Read each Use Case and evaluate its quality. " +
                "Return the EXACT SAME JSON array, but append 4 evaluation fields to EACH object:\n" +
                "1. 'quality_status': (String) Quality status, must be strictly one of: 'OK', 'Warning', 'Error'.\n" +
                "2. 'warnings': (Array of Strings) List in ENGLISH any ambiguities, lack of details, or ACTOR VIOLATIONS (if they use an actor NOT in the ALLOWED ACTORS list, you MUST flag a warning).\n" +
                "3. 'errors': (Array of Strings) List in ENGLISH any logical errors, disconnected alternative flows, contradictions, or SCOPE CREEP / COMPLETENESS ISSUES (e.g., Use Case has actions totally unrelated to the Parent Requirement, or postcondition fails to achieve the goal).\n" +
                "4. 'isDuplicate': (Boolean) Set to true IF AND ONLY IF this newly generated Use Case is a SEMANTIC DUPLICATE or functionally identical to any Use Case in the EXISTING USE CASES list. CRITICAL: If the EXISTING USE CASES list says '(No existing use cases)', you MUST ALWAYS set 'isDuplicate' to false for ALL use cases. NEVER flag duplicates against other newly generated use cases within the raw JSON itself.\n\n" +
                "CRITICAL RULE: YOU MUST PRESERVE ALL ORIGINAL FIELDS from the input JSON. You MUST NOT remove or alter 'precondition', 'postcondition', 'mainSuccessScenario', 'alternativeFlows', 'startDate', 'deadline', 'includes', 'extendsList'. DO NOT REMOVE ANY EXISTING FIELD.\n\n" +
                "ABSOLUTELY RETURN ONLY THE JSON ARRAY. NO ADDITIONAL COMMENTS.\n\n" +
                "--- ALLOWED ACTORS ---\n" + actorsContext + "\n\n" +
                "--- EXISTING USE CASES ---\n" + existingUcsContext + "\n\n" +
                "--- PARENT REQUIREMENTS ---\n" + reqsContext.toString() + "\n\n" +
                "--- RAW USE CASES JSON ---\n" + rawUseCasesJson;

        return cleanJsonOutput(geminiService.generateText(prompt));
    }

    private String cleanJsonOutput(String response) {
        if (response == null) return "";
        
        // Fix Gemini JSON hallucinations with invalid escapes like \0
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
                if (codeBlockEnd > codeBlockStart && codeBlockStart != codeBlockEnd) {
                    response = response.substring(codeBlockStart + 3, codeBlockEnd);
                    if (response.trim().startsWith("json")) {
                        response = response.trim().substring(4);
                    }
                }
            }
        }
        
        response = response.trim();
        int firstCurly = response.indexOf("{");
        int lastCurly = response.lastIndexOf("}");
        int firstSquare = response.indexOf("[");
        int lastSquare = response.lastIndexOf("]");
        
        if (firstCurly != -1 && lastCurly > firstCurly) {
            if (firstSquare != -1 && lastSquare > firstSquare) {
                if (firstCurly < firstSquare && lastCurly > lastSquare) {
                    return response.substring(firstCurly, lastCurly + 1);
                } else if (firstSquare < firstCurly && lastSquare > lastCurly) {
                    return response.substring(firstSquare, lastSquare + 1);
                } else {
                    if (firstCurly < firstSquare) return response.substring(firstCurly, lastCurly + 1);
                    else return response.substring(firstSquare, lastSquare + 1);
                }
            } else {
                return response.substring(firstCurly, lastCurly + 1);
            }
        } else if (firstSquare != -1 && lastSquare > firstSquare) {
            return response.substring(firstSquare, lastSquare + 1);
        }
        return response;
    }
}
