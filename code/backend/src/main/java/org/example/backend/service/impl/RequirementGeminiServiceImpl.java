package org.example.backend.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.service.AiRoutingService;
import org.example.backend.service.RequirementGeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

import com.fasterxml.jackson.databind.ObjectMapper;

@Slf4j
@Service
public class RequirementGeminiServiceImpl implements RequirementGeminiService {

    private final AiRoutingService geminiService;
    private final ObjectMapper objectMapper;

    @Autowired
    public RequirementGeminiServiceImpl(AiRoutingService geminiService, ObjectMapper objectMapper) {
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    // Max chars per chunk — sized to fit within Groq 12000 TPM with prompt overhead (~3000 chars instructions)
    private static final int CHUNK_SIZE = 7000;

    /** Split document into overlapping chunks to avoid missing content at boundaries */
    private java.util.List<String> chunkDocument(String text) {
        java.util.List<String> chunks = new java.util.ArrayList<>();
        if (text == null || text.isEmpty()) return chunks;
        if (text.length() <= CHUNK_SIZE) { chunks.add(text); return chunks; }

        int start = 0;
        int overlap = 200; // overlap to avoid cutting sentences
        while (start < text.length()) {
            int end = Math.min(start + CHUNK_SIZE, text.length());
            // Try to break at a newline to avoid cutting mid-sentence
            if (end < text.length()) {
                int nlPos = text.lastIndexOf('\n', end);
                if (nlPos > start + CHUNK_SIZE / 2) end = nlPos + 1;
            }
            chunks.add(text.substring(start, end));
            start = end - overlap;
            if (start >= text.length()) break;
        }
        return chunks;
    }

    @Override
    public String extractRequirementsFromText(String documentText, org.example.backend.entity.Project project) {
        // Phase 1: Determine Domain and Priorities (use first chunk only — sufficient for domain detection)
        String phase1Text = documentText.length() > CHUNK_SIZE ? documentText.substring(0, CHUNK_SIZE) : documentText;
        String phase1Prompt = "You are an expert System Architect. Analyze the following project document text. " +
                "Your task is to identify the primary business domain of the project and list the top 3-5 most critical Non-Functional Requirements (NFRs) / Constraints for this specific domain. " +
                "Your response MUST be a pure JSON object (without ```json wrappers) with exactly two fields:\n" +
                "1. 'domain': (String) The specific business domain (e.g., Banking, E-commerce, Healthcare, Logistics).\n" +
                "2. 'priorities': (Array of Strings) The top 3-5 critical NFRs or business priorities (e.g., ['Data Encryption', 'High Availability', 'Audit Logging']).\n" +
                "Do not add any explanation, return ONLY the JSON object.\n\n" +
                "--- DOCUMENT TEXT ---\n" + phase1Text;

        String phase1Response = cleanJsonOutput(geminiService.generateText(phase1Prompt));

        String domain = "General Software";
        String priorities = "Standard performance, security, and usability best practices";
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode p1Node = om.readTree(phase1Response);
            if (p1Node.has("domain")) domain = p1Node.get("domain").asText();
            if (p1Node.has("priorities")) {
                StringBuilder sb = new StringBuilder();
                for (com.fasterxml.jackson.databind.JsonNode node : p1Node.get("priorities")) {
                    if (sb.length() > 0) sb.append(", ");
                    sb.append(node.asText());
                }
                priorities = sb.toString();
            }
        } catch (Exception e) { /* fallback to defaults */ }

        // Phase 2: Chunk document and extract requirements from each chunk
        java.util.List<String> chunks = chunkDocument(documentText);
        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.node.ArrayNode allRequirements = om.createArrayNode();
        com.fasterxml.jackson.databind.node.ArrayNode allActors = om.createArrayNode();

        String projectDeadline = (project != null && project.getDeadline() != null) ? project.getDeadline().toString() : "N/A";
        String today = LocalDate.now().toString();
        final String finalDomain = domain;
        final String finalPriorities = priorities;

        for (int ci = 0; ci < chunks.size(); ci++) {
            String chunk = chunks.get(ci);
            String chunkNote = chunks.size() > 1
                ? "NOTE: This is chunk " + (ci + 1) + " of " + chunks.size() + " of the full document. Extract ALL requirements visible in this chunk. Do NOT skip any.\n\n"
                : "";

            String prompt = chunkNote +
                    "Below is the text extracted from a project requirement document. " +
                    "CRITICAL INSTRUCTION: You are an expert Senior Business Analyst. Your task is to analyze the text and extract Actors and Requirements. " +
                    "DO NOT just literally copy what is in the document. Deeply analyze it and deduce the core business model.\n" +
                    "=== GRANULARITY RULE ===\n" +
                    "You MUST break down the system into GRANULAR, ATOMIC, and ACTIONABLE requirements. " +
                    "DO NOT generate high-level, generic Epics or Modules like 'Order Management', 'User Management', or 'Authentication System'.\n" +
                    "CRITICAL: NEVER generate requirements with generic titles like 'Manage [Entity]' or 'CRUD [Entity]'. You MUST split them into atomic actions: 'Create [Entity]', 'Update [Entity]', 'Delete [Entity]', 'View [Entity] List'.\n" +
                    "COMPREHENSIVENESS IS MANDATORY: Extract ALL functional units in this chunk. Do not summarize, group, or skip any feature.\n" +
                    "\n[CRITICAL PROJECT CONTEXT]:\n" +
                    "- Business Domain: " + finalDomain + "\n" +
                    "- Strict Domain Priorities/Constraints: " + finalPriorities + "\n\n" +
                    "Your response MUST be a pure JSON object (without ```json wrappers), with EXACTLY two fields: 'project_actors' and 'requirements'.\n" +
                    "1. 'project_actors': (Array of Objects) Each must have 'name' (String) and optional 'inheritsFrom' (String). Only include actors relevant to THIS chunk.\n" +
                    "2. 'requirements': (Array of Objects) Each with fields:\n" +
                    "   a. 'title': Concise, specific, actionable requirement title.\n" +
                    "   b. 'description': Detailed description explaining Who, What, Why.\n" +
                    "   c. 'priority': One of 'Low', 'Medium', 'High', 'Critical'.\n" +
                    "   d. 'type': One of 'FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS_RULE', 'SECURITY'.\n" +
                    "   e. 'acceptanceCriteria': (Array of Strings) Minimum 3 criteria covering success, error, and business rule flows.\n" +
                    "   f. 'startDate': YYYY-MM-DD, not before " + today + ".\n" +
                    "   g. 'deadline': YYYY-MM-DD, not after " + projectDeadline + ".\n" +
                    "CRITICAL: Write ONLY in ENGLISH. Return ONLY the JSON object.\n\n" +
                    "--- DOCUMENT TEXT ---\n" + chunk;

            try {
                String chunkResponse = cleanJsonOutput(geminiService.generateText(prompt));
                com.fasterxml.jackson.databind.JsonNode chunkNode = om.readTree(chunkResponse);

                // Merge requirements
                com.fasterxml.jackson.databind.JsonNode reqs = chunkNode.has("requirements") ? chunkNode.get("requirements") : chunkNode;
                if (reqs != null && reqs.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode r : reqs) allRequirements.add(r);
                }
                // Merge actors (deduplicate by name)
                if (chunkNode.has("project_actors") && chunkNode.get("project_actors").isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode a : chunkNode.get("project_actors")) {
                        String name = a.has("name") ? a.get("name").asText().toLowerCase() : "";
                        boolean exists = false;
                        for (com.fasterxml.jackson.databind.JsonNode existing : allActors) {
                            if (existing.has("name") && existing.get("name").asText().equalsIgnoreCase(name)) { exists = true; break; }
                        }
                        if (!exists && !name.isEmpty()) allActors.add(a);
                    }
                }
            } catch (Exception e) {
                // If one chunk fails, continue with others
                log.warn("Chunk {} of {} failed: {}", ci + 1, chunks.size(), e.getMessage());
            }
        }

        // Build final merged JSON
        try {
            com.fasterxml.jackson.databind.node.ObjectNode result = om.createObjectNode();
            result.set("project_actors", allActors);
            result.set("requirements", allRequirements);
            return om.writeValueAsString(result);
        } catch (Exception e) {
            log.error("Failed to serialize merged requirements: {}", e.getMessage());
            return "{\"project_actors\":[], \"requirements\":[]}";
        }
    }

    // Max chars for document context passed to critic — prevents OOM when building large prompts
    private static final int CRITIC_DOC_MAX_CHARS = 3000;
    // Max chars for raw requirements JSON per critic batch
    private static final int CRITIC_BATCH_CHARS = 8000;

    @Override
    public String evaluateRequirementsWithCritic(String rawRequirementsJson, String documentText, java.util.List<String> existingRequirements) {
        String existingReqsText = existingRequirements != null && !existingRequirements.isEmpty()
                ? String.join("\n- ", existingRequirements)
                : "(No existing requirements in the project)";

        // Truncate documentText to avoid OOM when building the prompt string
        String truncatedDoc = documentText != null && documentText.length() > CRITIC_DOC_MAX_CHARS
                ? documentText.substring(0, CRITIC_DOC_MAX_CHARS) + "\n...[truncated for critic review]"
                : (documentText != null ? documentText : "");

        // If rawRequirementsJson is too large, batch it to avoid OOM
        if (rawRequirementsJson != null && rawRequirementsJson.length() > CRITIC_BATCH_CHARS) {
            return evaluateRequirementsWithCriticBatched(rawRequirementsJson, truncatedDoc, existingReqsText);
        }

        return callCriticApi(rawRequirementsJson, truncatedDoc, existingReqsText);
    }

    private String callCriticApi(String reqsJson, String truncatedDoc, String existingReqsText) {
        String prompt = "You are an extremely strict Senior QA / Business Analyst (AI Critic). " +
                "I will provide you with a list of recently extracted Requirements (in JSON format), " +
                "a summary of the original document, and the EXISTING REQUIREMENTS LIST.\n\n" +
                "Your task: Read each Requirement and evaluate its quality. " +
                "Also, check if it is a semantic duplicate of any existing requirements. " +
                "Return the exact same JSON array, but append 5 evaluation fields to EACH object:\n" +
                "1. 'quality_status': (String) Quality status, must be strictly one of: 'OK', 'Warning', 'Error'.\n" +
                "2. 'warnings': (Array of Strings) List any ambiguities or lack of details in ENGLISH (if any; empty array if none).\n" +
                "3. 'errors': (Array of Strings) List any factual errors or contradictions in ENGLISH (if any; empty array if none).\n" +
                "4. 'source_excerpt': (String) A short relevant excerpt from the document context. If not found, write 'N/A'.\n" +
                "5. 'isDuplicate': (Boolean) Set to true IF AND ONLY IF this Requirement is a SEMANTIC DUPLICATE of any Requirement in the EXISTING REQUIREMENTS LIST. CRITICAL: If the list says '(No existing requirements in the project)', ALWAYS set 'isDuplicate' to false. NEVER flag duplicates within the raw JSON itself.\n\n" +
                "CRITICAL RULE: PRESERVE ALL ORIGINAL FIELDS. DO NOT REMOVE ANY EXISTING FIELD.\n" +
                "ABSOLUTELY RETURN ONLY THE JSON ARRAY. NO ADDITIONAL COMMENTS.\n\n" +
                "--- EXISTING REQUIREMENTS LIST ---\n- " + existingReqsText + "\n\n" +
                "--- RAW REQUIREMENTS JSON ---\n" + reqsJson + "\n\n" +
                "--- DOCUMENT CONTEXT (summary) ---\n" + truncatedDoc;

        return cleanJsonOutput(geminiService.generateText(prompt));
    }

    private String evaluateRequirementsWithCriticBatched(String rawRequirementsJson, String truncatedDoc, String existingReqsText) {
        // Parse into array, batch by approximate char count, then merge results
        com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
        com.fasterxml.jackson.databind.node.ArrayNode evaluated = om.createArrayNode();
        try {
            com.fasterxml.jackson.databind.JsonNode arr = om.readTree(rawRequirementsJson);
            if (!arr.isArray()) {
                return callCriticApi(rawRequirementsJson, truncatedDoc, existingReqsText);
            }

            java.util.List<com.fasterxml.jackson.databind.JsonNode> batch = new java.util.ArrayList<>();
            int batchChars = 0;

            for (com.fasterxml.jackson.databind.JsonNode node : arr) {
                String nodeStr = node.toString();
                if (batchChars + nodeStr.length() > CRITIC_BATCH_CHARS && !batch.isEmpty()) {
                    // Flush batch
                    String batchJson = buildArrayString(batch, om);
                    String result = callCriticApi(batchJson, truncatedDoc, existingReqsText);
                    appendParsedArray(evaluated, result, om, batch);
                    batch.clear();
                    batchChars = 0;
                }
                batch.add(node);
                batchChars += nodeStr.length();
            }
            // Flush remaining
            if (!batch.isEmpty()) {
                String batchJson = buildArrayString(batch, om);
                String result = callCriticApi(batchJson, truncatedDoc, existingReqsText);
                appendParsedArray(evaluated, result, om, batch);
            }

            return om.writeValueAsString(evaluated);
        } catch (Exception e) {
            log.warn("Batched critic failed, falling back to single call: {}", e.getMessage());
            return callCriticApi(rawRequirementsJson, truncatedDoc, existingReqsText);
        }
    }

    private String buildArrayString(java.util.List<com.fasterxml.jackson.databind.JsonNode> nodes,
                                    com.fasterxml.jackson.databind.ObjectMapper om) throws Exception {
        com.fasterxml.jackson.databind.node.ArrayNode arr = om.createArrayNode();
        nodes.forEach(arr::add);
        return om.writeValueAsString(arr);
    }

    private void appendParsedArray(com.fasterxml.jackson.databind.node.ArrayNode target,
                                   String json,
                                   com.fasterxml.jackson.databind.ObjectMapper om,
                                   java.util.List<com.fasterxml.jackson.databind.JsonNode> fallbackNodes) {
        try {
            com.fasterxml.jackson.databind.JsonNode parsed = om.readTree(cleanJsonOutput(json));
            if (parsed.isArray()) {
                parsed.forEach(target::add);
                return;
            }
        } catch (Exception ignored) {}
        // Fallback: add original nodes without critic fields
        fallbackNodes.forEach(n -> {
            if (n instanceof com.fasterxml.jackson.databind.node.ObjectNode obj) {
                obj.put("quality_status", "OK");
                obj.putArray("warnings");
                obj.putArray("errors");
                obj.put("source_excerpt", "N/A");
                obj.put("isDuplicate", false);
            }
            target.add(n);
        });
    }

    @Override
    public String evaluateDocumentContext(java.util.List<String> existingRequirementContexts, String documentText) {
        if (existingRequirementContexts == null || existingRequirementContexts.isEmpty()) {
            return "{\"relevanceScore\": 100, \"reason\": \"Project has no requirements. Automatically switching to Bootstrap Mode to accept the first document as the baseline context.\"}";
        }

        String contextListString = String.join("\n- ", existingRequirementContexts);
        
        String prompt = "You are a professional Content Auditing AI. Your task is to evaluate the relevance of an uploaded document against the project's existing Requirements.\n" +
                "Below are some existing Requirements in the project (acting as the baseline context):\n" +
                "- " + contextListString + "\n\n" +
                "Please read the uploaded document text below and return a SINGLE JSON OBJECT with 2 fields:\n" +
                "1. 'relevanceScore': (Number) A score from 0 to 100.\n" +
                "   - 100: Perfectly matches all details.\n" +
                "   - 80-99: Completely matches the domain and main objectives.\n" +
                "   - 40-70: Same business domain but DIFFERENT OBJECTIVES/LANGUAGE (e.g., old project is in English, new document is in Chinese/Japanese -> MUST score 40-70).\n" +
                "   - Under 30: COMPLETELY OFF-TOPIC (e.g., educational app but uploaded a milk tea shop document).\n" +
                "2. 'reason': (String) Explain the reason IN ENGLISH. MANDATORY RULE: WRITE EXACTLY ONE SHORT SENTENCE (MAXIMUM 20 WORDS), getting straight to the core difference (if any).\n\n" +
                "NOTE: Return pure JSON, without ```json wrappers.\n" +
                "--- UPLOADED DOCUMENT TEXT ---\n" + documentText;
        
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
