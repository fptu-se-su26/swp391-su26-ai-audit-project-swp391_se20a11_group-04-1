package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import org.example.backend.exception.BusinessException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.example.backend.config.GeminiProperties;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GeminiServiceImpl implements GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiProperties geminiProperties;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);

    @Autowired
    public GeminiServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper, GeminiProperties geminiProperties) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.geminiProperties = geminiProperties;
    }

    @Override
    public String generateText(String prompt) {
        return callGeminiApi(prompt);
    }

    @Override
    public String extractRequirementsFromText(String documentText) {
        // Phase 1: Determine Domain and Priorities
        String phase1Prompt = "You are an expert System Architect. Analyze the following project document text. " +
                "Your task is to identify the primary business domain of the project and list the top 3-5 most critical Non-Functional Requirements (NFRs) / Constraints for this specific domain. " +
                "Your response MUST be a pure JSON object (without ```json wrappers) with exactly two fields:\n" +
                "1. 'domain': (String) The specific business domain (e.g., Banking, E-commerce, Healthcare, Logistics).\n" +
                "2. 'priorities': (Array of Strings) The top 3-5 critical NFRs or business priorities (e.g., ['Data Encryption', 'High Availability', 'Audit Logging']).\n" +
                "Do not add any explanation, return ONLY the JSON object.\n\n" +
                "--- DOCUMENT TEXT ---\n" + documentText;

        String phase1Response = cleanJsonOutput(callGeminiApi(phase1Prompt));

        String domain = "General Software";
        String priorities = "Standard performance, security, and usability best practices";
        try {
            JsonNode p1Node = objectMapper.readTree(phase1Response);
            if (p1Node.has("domain")) {
                domain = p1Node.get("domain").asText();
            }
            if (p1Node.has("priorities")) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode node : p1Node.get("priorities")) {
                    if (sb.length() > 0) sb.append(", ");
                    sb.append(node.asText());
                }
                priorities = sb.toString();
            }
        } catch (Exception e) {
            log.warn("Failed to parse Phase 1 domain classification JSON. Using fallback.", e);
        }

        // Phase 2: Generate Requirements with Domain Context
        // Prompt AI: Trích xuất danh sách Actor và Requirement từ nội dung tài liệu tải lên. 
        // Phân loại độ ưu tiên, tag, loại (Functional, Security...) và tự động sinh các Acceptance Criteria.
        String prompt = "Below is the text extracted from a project requirement document. " +
                "Your task is to analyze and extract a list of Actors (Roles) and Requirements from this text. " +
                "\n\n[CRITICAL PROJECT CONTEXT]:\n" +
                "- Business Domain: " + domain + "\n" +
                "- Strict Domain Priorities/Constraints: " + priorities + "\n" +
                "When generating Acceptance Criteria (especially for Non-Functional requirements), you MUST strictly enforce and integrate the domain constraints mentioned above.\n\n" +
                "Your response MUST be a pure JSON object (without ```json wrappers), with EXACTLY two fields: 'project_actors' and 'requirements'.\n" +
                "1. 'project_actors': (Array of Objects) List of roles detected in the text. Each object must have 'name' (String) and 'description' (String).\n" +
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
                "   f. 'acceptanceCriteria': (Array of Strings) Automatically infer and generate an appropriate number of acceptance criteria for each requirement. The criteria MUST deeply integrate the Domain Priorities (" + priorities + ") listed above.\n" +
                "CRITICAL: The entire generated content MUST BE WRITTEN IN ENGLISH, regardless of the original document's language.\n" +
                "Do not add any explanation, return ONLY the JSON object.\n\n" +
                "--- DOCUMENT TEXT ---\n" + documentText;

        return cleanJsonOutput(callGeminiApi(prompt));
    }

    private String cleanJsonOutput(String response) {
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        return response.trim();
    }
    @Override
    public String generateUseCasesFromRequirements(java.util.List<org.example.backend.entity.Requirement> requirements, java.util.List<String> projectActors, java.util.List<String> existingUseCases) {
        StringBuilder reqsContext = new StringBuilder();
        for (org.example.backend.entity.Requirement r : requirements) {
            reqsContext.append("Requirement ID: ").append(r.getId()).append("\n");
            reqsContext.append("Title: ").append(r.getTitle()).append("\n");
            reqsContext.append("Description: ").append(r.getDescription()).append("\n");
            reqsContext.append("Type: ").append(r.getType()).append("\n");
            if (r.getType() != null) {
                switch (r.getType()) {
                    case FUNCTIONAL:
                        reqsContext.append("Instruction: This is a Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses. Extract Primary Actors and step-by-step flows.\n");
                        break;
                    case NON_FUNCTIONAL:
                        reqsContext.append("Instruction: This is a Non-Functional Requirement. If a Use Case cannot be meaningfully created, skip this requirement entirely and return an empty array for it. Do not force the creation of user-action Use Cases.\n");
                        break;
                    case BUSINESS_RULE:
                        reqsContext.append("Instruction: This is a Business Rule. Generate exactly one Use Case named 'Validate [Rule Name]' with alternate flows detailing when the rule is violated. Do not generate standard functional flows.\n");
                        break;
                    case SECURITY:
                        reqsContext.append("Instruction: This is a Security Requirement. Focus on threat prevention, access control, and data protection. The primary actor for Security Use Cases MUST be 'System' or 'Admin', NOT regular users.\n");
                        break;
                    default:
                        reqsContext.append("Instruction: Treat this as a standard Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses.\n");
                        break;
                }
            } else {
                reqsContext.append("Instruction: Treat this as a standard Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses.\n");
            }
            reqsContext.append("Acceptance Criteria: ").append(r.getAcceptanceCriteria()).append("\n");
            reqsContext.append("---\n");
        }

        String actorsContext = projectActors != null && !projectActors.isEmpty() 
                ? String.join(", ", projectActors) 
                : "(No pre-defined actors. Use standard generic actors)";
        
        String existingUcContext = existingUseCases != null && !existingUseCases.isEmpty()
                ? String.join("\n- ", existingUseCases)
                : "(No existing use cases)";

        // Prompt AI: Tạo danh sách Use Case (kịch bản sử dụng) dựa trên các Requirement (Yêu cầu) đã có.
        // Hướng dẫn AI cách viết luồng chính (main flow), luồng thay thế (alternative flows), và cách map với Actors, Includes, Extends theo chuẩn UML.
        String prompt = "You are an expert Business Analyst. I will provide you with one or more System Requirements.\n" +
                "Your task is to analyze these requirements and break them down into detailed Use Cases.\n" +
                "For EACH requirement, generate one or more Use Cases that fulfill it.\n\n" +
                "Your response MUST be a pure JSON array (without ```json wrappers). " +
                "Each object in the array represents ONE Use Case and must have EXACTLY these fields:\n" +
                "1. 'name': (String) A short, descriptive name (e.g., 'User Login').\n" +
                "2. 'primaryActors': (String) Comma separated actors. YOU MUST CHOOSE ONLY FROM THESE ALLOWED ACTORS: [" + actorsContext + "]. DO NOT invent new actors.\n" +
                "3. 'precondition': (String) What must be true before this use case begins.\n" +
                "4. 'postcondition': (String) What is the state of the system after this use case ends.\n" +
                "5. 'mainSuccessScenario': (String) The main success flow, 1 step per line. Number the steps like '1. ...\\n2. ...'\n" +
                "6. 'alternativeFlows': (String) Alternative or error flows. The number in 'AF[Number]' MUST BE THE EXACT STEP NUMBER from the main flow that it replaces or branches from. For example, if the flow branches from step 7, it MUST be named 'AF7:'. DO NOT name it 'AF1:' unless it branches from step 1. You MUST separate steps with NEWLINES ('\\n'). Example: 'AF7: If user saves as draft:\\n1. System saves privately.\\n2. User exits.' DO NOT write steps on a single line. DO NOT use markdown formatting like `**` or `*`.\n" +
                "7. 'requirementId': (Number) The EXACT ID of the Requirement this Use Case belongs to. You MUST copy the exact 'Requirement ID' number from the input. DO NOT make up a number.\n" +
                "8. 'includes': (Array of Strings) A list of existing Use Case names that this Use Case INCLUDES. \n" +
                "   - RULE: Include means this Use Case strictly REQUIRES the included Use Case to complete its main flow. \n" +
                "   - Identify included Use Cases by their names (e.g., Record, Log, Verify, Validate, Save, Authenticate). \n" +
                "   - Direction: This Use Case ---> Included Use Case. \n" +
                "   - Return [] if none. Do NOT guess. Limit to 1-2 most critical includes.\n" +
                "9. 'extendsList': (Array of Strings) A list of existing Use Case names that this Use Case EXTENDS. \n" +
                "   - RULE: Extend means this Use Case is an OPTIONAL/ALTERNATIVE extension to the base Use Case. \n" +
                "   - Identify extending Use Cases by their names (e.g., View Detail, View Results, Cancel, Edit, Export). \n" +
                "   - Direction: This Use Case (Extension) ---> Base Use Case. \n" +
                "   - Return [] if none. Do NOT guess. Limit to 1-2 most critical extends.\n\n" +
                "STRICT UML BUSINESS RULES:\n" +
                "- An isolated Use Case (no actors) CANNOT include or extend other isolated Use Cases. At least one must be connected to an actor.\n" +
                "- Use Cases that represent system sub-routines (e.g., Record, Log, Verify) should generally NOT have an actor connected directly to them, and should only be 'included' by other Use Cases.\n" +
                "- DO NOT connect actors to sub-routine Use Cases. DO NOT add include/extend relations if not completely obvious. Prefer a clean diagram over a messy one.\n\n" +
                "CRITICAL INSTRUCTION: All generated text (except keys) MUST BE WRITTEN IN ENGLISH, to match the target audience.\n" +
                "YOU MUST RETURN ONLY A DIRECT JSON ARRAY. DO NOT WRAP IT IN A JSON OBJECT.\n\n" +
                "--- ALLOWED ACTORS ---\n" + actorsContext + "\n\n" +
                "--- EXISTING USE CASES ---\n" + existingUcContext + "\n\n" +
                "--- SYSTEM REQUIREMENTS ---\n" + reqsContext.toString();
        
        String response = callGeminiApi(prompt);
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        
        // Cố gắng loại bỏ các ký tự thừa nếu có
        response = response.trim();
        int firstBracket = response.indexOf("[");
        int lastBracket = response.lastIndexOf("]");
        if (firstBracket >= 0 && lastBracket >= 0 && lastBracket > firstBracket) {
            response = response.substring(firstBracket, lastBracket + 1);
        }
        return response;
    }

    @Override
    public String evaluateRequirementsWithCritic(String rawRequirementsJson, String documentText, java.util.List<String> existingRequirements) {
        String existingReqsText = existingRequirements != null && !existingRequirements.isEmpty() 
                ? String.join("\n- ", existingRequirements) 
                : "(No existing requirements in the project)";

        // Prompt AI (Critic): Đóng vai trò chuyên gia QA/BA để chấm điểm và đánh giá chất lượng của các Requirement vừa được AI tạo ra.
        // Tìm ra các điểm tối nghĩa, sai logic, trích xuất dẫn chứng từ tài liệu gốc, và phát hiện Requirement bị trùng lặp.
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
                "ABSOLUTELY RETURN ONLY THE JSON ARRAY. NO ADDITIONAL COMMENTS.\n\n" +
                "--- EXISTING REQUIREMENTS LIST ---\n- " + existingReqsText + "\n\n" +
                "--- RAW REQUIREMENTS JSON ---\n" + rawRequirementsJson + "\n\n" +
                "--- ORIGINAL DOCUMENT TEXT ---\n" + documentText;

        String response = callGeminiApi(prompt);
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        return response.trim();
    }

    private String callGeminiApi(String prompt) {
        String targetUrl = geminiProperties.getUrl();
        if (targetUrl == null || targetUrl.isEmpty()) {
            throw new BusinessException("Chưa cấu hình URL (gemini.api.url) trong application.yaml");
        }

        List<String> keys = geminiProperties.getKeys();
        if (keys == null || keys.isEmpty()) {
            throw new BusinessException("API Keys của Gemini chưa được cấu hình. Vui lòng thêm vào application.yaml.");
        }

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", prompt);

        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", List.of(parts));

        requestBody.put("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        int maxRetries = keys.size();
        for (int i = 0; i < maxRetries; i++) {
            int index = currentKeyIndex.getAndUpdate(idx -> (idx + 1) % keys.size());
            String apiKey = keys.get(index);
            String requestUrl = targetUrl + "?key=" + apiKey;

            try {
                // Send POST request
                String jsonResponse = restTemplate.postForObject(requestUrl, entity, String.class);
                
                // Parse the JSON response
                JsonNode rootNode = objectMapper.readTree(jsonResponse);
                JsonNode textNode = rootNode.path("candidates")
                                            .get(0)
                                            .path("content")
                                            .path("parts")
                                            .get(0)
                                            .path("text");
                
                if (textNode.isMissingNode()) {
                    throw new BusinessException("Không tìm thấy kết quả hợp lệ từ Gemini.");
                }
                
                return textNode.asText();
            } catch (HttpStatusCodeException httpException) {
                int statusCode = httpException.getStatusCode().value();
                log.error("Gemini API HTTP Error {}: {}", statusCode, httpException.getResponseBodyAsString());
                
                if (statusCode == 429) {
                    log.warn("Gemini API Quota Exceeded (429) for key ending in {}. Switching to next key...", apiKey.substring(Math.max(0, apiKey.length() - 4)));
                    if (i == maxRetries - 1) {
                        throw new BusinessException("Gemini API Quota Exceeded (429) trên tất cả các API keys. Vui lòng đợi một lát rồi thử lại.");
                    }
                    // Loop will continue and try the next key
                } else if (statusCode == 404) {
                    throw new BusinessException("Gemini Model not found or API Key lacks access (404 Not Found).");
                } else if (statusCode == 400) {
                    throw new BusinessException("Bad Request payload sent to Gemini (400 Bad Request).");
                } else if (statusCode == 503) {
                    log.warn("Gemini API 503 Service Unavailable. Retrying after 5 seconds...");
                    try {
                        Thread.sleep(5000); // Đợi 5s rồi thử lại
                        String retryJson = restTemplate.postForObject(requestUrl, entity, String.class);
                        JsonNode retryRootNode = objectMapper.readTree(retryJson);
                        return retryRootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                    } catch (Exception retryEx) {
                        throw new BusinessException("Gemini API is currently overloaded (503 Service Unavailable). Please try again in a few minutes.");
                    }
                } else {
                    throw new BusinessException("Lỗi kết nối Gemini API: " + statusCode);
                }
            } catch (Exception ex) {
                if (ex instanceof BusinessException) {
                    throw (BusinessException) ex;
                }
                log.error("Gemini API Exception: ", ex);
                throw new BusinessException("Lỗi xử lý kết quả từ Gemini API: " + ex.getMessage());
            }
        }
        
        throw new BusinessException("Không thể gọi Gemini API với các keys hiện có.");
    }

    @Override
    public String evaluateDocumentContext(java.util.List<String> existingRequirementContexts, String documentText) {
        if (existingRequirementContexts == null || existingRequirementContexts.isEmpty()) {
            // Bootstrap Mode: No existing requirements to compare against, so pass safely.
            return "{\"relevanceScore\": 100, \"reason\": \"Project has no requirements. Automatically switching to Bootstrap Mode to accept the first document as the baseline context.\"}";
        }

        String contextListString = String.join("\n- ", existingRequirementContexts);
        
        // Prompt AI: Đánh giá độ liên quan của tài liệu được tải lên so với nội dung của dự án hiện tại.
        // So sánh tài liệu với các Requirement đã có để chấm điểm (0-100) xem tài liệu có bị lệch chủ đề (off-topic) hay không.
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
        
        String response = callGeminiApi(prompt);
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        return response.trim();
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

        // Prompt AI (Critic): Đóng vai trò chuyên gia QA/BA để chấm điểm và đánh giá chất lượng của các Use Case vừa được AI tạo ra.
        // Tìm lỗi logic, lỗi luồng thay thế, kiểm tra xem Actor có hợp lệ không, và phát hiện Use Case bị trùng lặp.
        String prompt = "You are an extremely strict Senior QA / Business Analyst (AI Critic). " +
                "I will provide you with a list of recently generated Use Cases (in JSON format), " +
                "their original parent Requirements, the list of EXISTING USE CASES in the project, and ALLOWED ACTORS.\n\n" +
                "Your task: Read each Use Case and evaluate its quality. " +
                "Return the EXACT SAME JSON array, but append 4 evaluation fields to EACH object:\n" +
                "1. 'quality_status': (String) Quality status, must be strictly one of: 'OK', 'Warning', 'Error'.\n" +
                "2. 'warnings': (Array of Strings) List in ENGLISH any ambiguities, lack of details, or ACTOR VIOLATIONS (if they use an actor NOT in the ALLOWED ACTORS list, you MUST flag a warning).\n" +
                "3. 'errors': (Array of Strings) List in ENGLISH any logical errors, disconnected alternative flows, contradictions, or SCOPE CREEP / COMPLETENESS ISSUES (e.g., Use Case has actions totally unrelated to the Parent Requirement, or postcondition fails to achieve the goal).\n" +
                "4. 'isDuplicate': (Boolean) Set to true IF AND ONLY IF this newly generated Use Case is a SEMANTIC DUPLICATE or functionally identical to any Use Case in the EXISTING USE CASES list. Otherwise, false.\n\n" +
                "ABSOLUTELY RETURN ONLY THE JSON ARRAY. NO ADDITIONAL COMMENTS.\n\n" +
                "--- ALLOWED ACTORS ---\n" + actorsContext + "\n\n" +
                "--- EXISTING USE CASES ---\n" + existingUcsContext + "\n\n" +
                "--- PARENT REQUIREMENTS ---\n" + reqsContext.toString() + "\n\n" +
                "--- RAW USE CASES JSON ---\n" + rawUseCasesJson;

        String response = callGeminiApi(prompt);
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        
        response = response.trim();
        int firstBracket = response.indexOf("[");
        int lastBracket = response.lastIndexOf("]");
        if (firstBracket >= 0 && lastBracket >= 0 && lastBracket > firstBracket) {
            response = response.substring(firstBracket, lastBracket + 1);
        }
        return response;
    }
}
