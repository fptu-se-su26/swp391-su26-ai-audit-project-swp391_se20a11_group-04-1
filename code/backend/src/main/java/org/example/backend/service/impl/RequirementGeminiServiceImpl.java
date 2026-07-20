package org.example.backend.service.impl;

import org.example.backend.service.AiRoutingService;
import org.example.backend.service.RequirementGeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class RequirementGeminiServiceImpl implements RequirementGeminiService {

    private final AiRoutingService geminiService;
    private final ObjectMapper objectMapper;

    @Autowired
    public RequirementGeminiServiceImpl(AiRoutingService geminiService, ObjectMapper objectMapper) {
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String extractRequirementsFromText(String documentText, org.example.backend.entity.Project project) {
        // Phase 1: Determine Domain and Priorities
        String phase1Prompt = "You are an expert System Architect. Analyze the following project document text. " +
                "Your task is to identify the primary business domain of the project and list the top 3-5 most critical Non-Functional Requirements (NFRs) / Constraints for this specific domain. " +
                "Your response MUST be a pure JSON object (without ```json wrappers) with exactly two fields:\n" +
                "1. 'domain': (String) The specific business domain (e.g., Banking, E-commerce, Healthcare, Logistics).\n" +
                "2. 'priorities': (Array of Strings) The top 3-5 critical NFRs or business priorities (e.g., ['Data Encryption', 'High Availability', 'Audit Logging']).\n" +
                "Do not add any explanation, return ONLY the JSON object.\n\n" +
                "--- DOCUMENT TEXT ---\n" + documentText;

        String phase1Response = cleanJsonOutput(geminiService.generateText(phase1Prompt));

        String domain = "General Software";
        String priorities = "Standard performance, security, and usability best practices";
        try {
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode p1Node = objectMapper.readTree(phase1Response);
            if (p1Node.has("domain")) {
                domain = p1Node.get("domain").asText();
            }
            if (p1Node.has("priorities")) {
                StringBuilder sb = new StringBuilder();
                for (com.fasterxml.jackson.databind.JsonNode node : p1Node.get("priorities")) {
                    if (sb.length() > 0) sb.append(", ");
                    sb.append(node.asText());
                }
                priorities = sb.toString();
            }
        } catch (Exception e) {
            // fallback
        }

        // Phase 2: Generate Requirements with Domain Context
        String prompt = "Below is the text extracted from a project requirement document. " +
                "CRITICAL INSTRUCTION: You are an expert Senior Business Analyst. Your task is to analyze the text and extract Actors and Requirements. " +
                "DO NOT just literally copy what is in the document. The document is often just a rough, incomplete draft. " +
                "You MUST deeply analyze it, deduce the core business model, and generate a COMPLETE, COMPREHENSIVE set of standard industry requirements that fully cover this project from end to end. " +
                "You MUST proactively add implicit, missing, but necessary requirements (e.g., Authentication, Authorization, Error Handling, Security, Audit Logs, standard CRUD operations for core entities) even if they are NOT explicitly mentioned in the text, so the final system architecture is logically sound, professional, and production-ready. " +
                "\n\n[CRITICAL PROJECT CONTEXT]:\n" +
                "- Business Domain: " + domain + "\n" +
                "- Strict Domain Priorities/Constraints: " + priorities + "\n" +
                "When generating Acceptance Criteria (especially for Non-Functional requirements), you MUST strictly enforce and integrate the domain constraints mentioned above.\n\n" +
                "Your response MUST be a pure JSON object (without ```json wrappers), with EXACTLY two fields: 'project_actors' and 'requirements'.\n" +
                "1. 'project_actors': (Array of Objects) List of roles detected in the text. Each object must have only 'name' (String). CRITICAL RULE: You MUST thoroughly analyze the text to identify ALL possible actors, roles, systems, or personas mentioned or implied (e.g., 'Admin', 'Customer', 'Manager', 'Guest', 'System', 'Staff'). DO NOT miss any role. Even if the text is short, you MUST ALWAYS include default standard actors such as 'User' and 'System' in this array, plus any domain-specific roles detected.\n" +
                "2. 'requirements': (Array of Objects) List of requirements. Each object represents a Requirement with the following fields:\n" +
                "   a. 'title': (String) A concise title of the requirement.\n" +
                "   b. 'description': (String) Detailed description.\n" +
                "   c. 'priority': (String) One of the values: 'Low', 'Medium', 'High', 'Critical'. Determine priority based on:\n" +
                "      - 'Critical': Core system functionality (auth, payments, security, primary business logic) without which the system cannot function.\n" +
                "      - 'High': Important features that significantly impact user experience or business value but are not absolute blockers for basic operation.\n" +
                "      - 'Medium': Standard features, common enhancements, or secondary functionality.\n" +
                "      - 'Low': 'Nice to have' features, minor UI tweaks, or rarely used edge cases.\n" +
                "   d. 'tags': (Array of Strings) A list of classification tags (e.g., ['Frontend', 'UI']).\n" +
                "   e. 'type': (String) MUST be exactly one of: 'FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS_RULE', 'SECURITY'. Analyze the description to classify it correctly.\n" +
                "   f. 'acceptanceCriteria': (Array of Strings) You MUST act as a Senior Business Analyst. Generate comprehensive, professional Acceptance Criteria for each requirement. Format the criteria strictly as detailed bullet points (Kiểu gạch đầu dòng chi tiết). DO NOT use Gherkin (Given/When/Then). You must deduce and write detailed criteria covering:\n" +
                "      - Positive flows (Luồng thành công).\n" +
                "      - Negative/Error flows (Luồng lỗi/Ngoại lệ).\n" +
                "      - Business Rules & Constraints (Luật kinh doanh).\n" +
                "      - UI/UX constraints (Ràng buộc giao diện).\n" +
                "      The criteria MUST deeply integrate the Domain Priorities (" + priorities + ") listed above.\n" +
                "   g. 'startDate': (String) Generate a logical start date for this requirement in YYYY-MM-DD format. The date MUST NOT be before TODAY's date: " + LocalDate.now().toString() + ". DO NOT generate a date in the past.\n" +
                "   h. 'deadline': (String) Generate a logical deadline for this requirement in YYYY-MM-DD format. The date MUST NOT be after the project deadline: " + (project != null && project.getDeadline() != null ? project.getDeadline().toString() : "N/A") + ". It must also be after the startDate.\n" +
                "CRITICAL: The entire generated content MUST BE WRITTEN IN ENGLISH, regardless of the original document's language.\n" +
                "Do not add any explanation, return ONLY the JSON object.\n\n" +
                "--- DOCUMENT TEXT ---\n" + documentText;

        return cleanJsonOutput(geminiService.generateText(prompt));
    }

    @Override
    public String evaluateRequirementsWithCritic(String rawRequirementsJson, String documentText, java.util.List<String> existingRequirements) {
        String existingReqsText = existingRequirements != null && !existingRequirements.isEmpty() 
                ? String.join("\n- ", existingRequirements) 
                : "(No existing requirements in the project)";

        String prompt = "You are an extremely strict Senior QA / Business Analyst (AI Critic). " +
                "I will provide you with a list of recently extracted Requirements (in JSON format), " +
                "the original document text, and the EXISTING REQUIREMENTS LIST.\n\n" +
                "Your task: Read each Requirement and compare it against the original document to EVALUATE ITS QUALITY. " +
                "Also, check if it is a semantic duplicate of any existing requirements. " +
                "Return the exact same JSON array, but append 5 evaluation fields to EACH object:\n" +
                "1. 'quality_status': (String) Quality status, must be strictly one of: 'OK', 'Warning', 'Error'.\n" +
                "2. 'warnings': (Array of Strings) List any ambiguities or lack of details in ENGLISH (if any; empty array if none).\n" +
                "3. 'errors': (Array of Strings) List any factual errors or contradictions in ENGLISH (if any; empty array if none).\n" +
                "4. 'source_excerpt': (String) Extract an EXACT text snippet (COPY WORD-FOR-WORD) from the original document as evidence for this Requirement. Do not rewrite or use the requirement's description.\n" +
                "5. 'isDuplicate': (Boolean) Set to true if this Requirement is a SEMANTIC DUPLICATE or functionally equivalent to any Requirement in the EXISTING REQUIREMENTS LIST. Otherwise, set to false.\n\n" +
                "CRITICAL RULE: YOU MUST PRESERVE ALL ORIGINAL FIELDS from the input JSON (especially 'startDate', 'deadline', 'acceptanceCriteria', 'type', 'priority', 'tags'). DO NOT REMOVE ANY EXISTING FIELD.\n\n" +
                "ABSOLUTELY RETURN ONLY THE JSON ARRAY. NO ADDITIONAL COMMENTS.\n\n" +
                "--- EXISTING REQUIREMENTS LIST ---\n- " + existingReqsText + "\n\n" +
                "--- RAW REQUIREMENTS JSON ---\n" + rawRequirementsJson + "\n\n" +
                "--- ORIGINAL DOCUMENT TEXT ---\n" + documentText;

        return cleanJsonOutput(geminiService.generateText(prompt));
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
