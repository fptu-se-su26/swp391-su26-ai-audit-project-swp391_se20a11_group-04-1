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
import org.example.backend.config.GeminiProperties;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GeminiServiceImpl implements GeminiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiProperties geminiProperties;

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
        String prompt = "Below is the text extracted from a project requirement document. " +
                "Your task is to analyze and extract a list of Requirements from this text. " +
                "Your response MUST be a pure JSON array (without ```json wrappers), " +
                "where each object represents a Requirement with the following fields:\n" +
                "1. 'title': (String) A concise title of the requirement.\n" +
                "2. 'description': (String) Detailed description.\n" +
                "3. 'priority': (String) One of the values: 'Low', 'Medium', 'High'.\n" +
                "4. 'tags': (Array of Strings) A list of classification tags (e.g., ['Frontend', 'UI']).\n" +
                "5. 'acceptanceCriteria': (Array of Strings) Automatically infer and generate an appropriate number of acceptance criteria for each requirement. Criteria must be clear, practical, and testable.\n" +
                "CRITICAL: The entire generated content (title, description, tags, acceptanceCriteria) MUST BE WRITTEN IN ENGLISH, regardless of the original document's language.\n" +
                "Do not add any explanation, return ONLY the JSON array.\n\n" +
                "--- DOCUMENT TEXT ---\n" + documentText;
        
        String response = callGeminiApi(prompt);
        // Clean up formatting if Gemini returns ```json ... ```
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
    public String generateUseCasesFromRequirements(java.util.List<org.example.backend.entity.Requirement> requirements) {
        StringBuilder reqsContext = new StringBuilder();
        for (org.example.backend.entity.Requirement r : requirements) {
            reqsContext.append("Requirement ID: ").append(r.getId()).append("\n");
            reqsContext.append("Title: ").append(r.getTitle()).append("\n");
            reqsContext.append("Description: ").append(r.getDescription()).append("\n");
            reqsContext.append("Acceptance Criteria: ").append(r.getAcceptanceCriteria()).append("\n");
            reqsContext.append("---\n");
        }

        String prompt = "You are an expert Business Analyst. I will provide you with one or more System Requirements.\n" +
                "Your task is to analyze these requirements and break them down into detailed Use Cases.\n" +
                "For EACH requirement, generate one or more Use Cases that fulfill it.\n\n" +
                "Your response MUST be a pure JSON array (without ```json wrappers). " +
                "Each object in the array represents ONE Use Case and must have EXACTLY these fields:\n" +
                "1. 'name': (String) A short, descriptive name (e.g., 'User Login').\n" +
                "2. 'primaryActors': (String) Comma separated actors. USE ONLY COMMON ROLES like 'User', 'Guest', 'Admin', 'Customer', 'System User'. DO NOT use weird or overly specific terms like 'Prospective User'.\n" +
                "3. 'precondition': (String) What must be true before this use case begins.\n" +
                "4. 'postcondition': (String) What is the state of the system after this use case ends.\n" +
                "5. 'mainSuccessScenario': (String) The main success flow, 1 step per line. Number the steps like '1. ...\\n2. ...'\n" +
                "6. 'alternativeFlows': (String) Alternative or error flows. Format like 'Auto (last step):\\nIf validation fails:\\n1. ...\\n2. ...'\n" +
                "7. 'requirementId': (Number) The EXACT ID of the Requirement this Use Case belongs to. You MUST copy the exact 'Requirement ID' number from the input. DO NOT make up a number.\n" +
                "8. 'includes': (Array of Strings) A list of Use Case names that this Use Case INCLUDES (e.g. ['User Login']). Return empty array [] if none.\n" +
                "9. 'extendsList': (Array of Strings) A list of Use Case names that this Use Case EXTENDS. Return empty array [] if none.\n\n" +
                "CRITICAL INSTRUCTION: All generated text (except keys) MUST BE WRITTEN IN ENGLISH, to match the target audience.\n" +
                "YOU MUST RETURN ONLY A DIRECT JSON ARRAY. DO NOT WRAP IT IN A JSON OBJECT.\n\n" +
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
        String apiKey = geminiProperties.getKey();
        if (apiKey == null || apiKey.isEmpty()) {
            throw new BusinessException("API Key của Gemini chưa được cấu hình. Vui lòng thêm vào application.yaml.");
        }

        String targetUrl = geminiProperties.getUrl();
        if (targetUrl == null || targetUrl.isEmpty()) {
            throw new BusinessException("Chưa cấu hình URL (gemini.api.url) trong application.yaml");
        }
        
        String requestUrl = targetUrl + "?key=" + apiKey;

        // Build the request body for Gemini API
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", prompt);

        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", List.of(parts));

        requestBody.put("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

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
                throw new BusinessException("Gemini API Quota Exceeded (429). Please use a new API Key.");
            } else if (statusCode == 404) {
                throw new BusinessException("Gemini Model not found or API Key lacks access (404 Not Found).");
            } else if (statusCode == 400) {
                throw new BusinessException("Bad Request payload sent to Gemini (400 Bad Request).");
            } else if (statusCode == 503) {
                log.warn("Gemini API 503 Service Unavailable. Retrying...");
                try {
                    Thread.sleep(5000); // Đợi 5s rồi thử lại
                    String retryJson = restTemplate.postForObject(requestUrl, entity, String.class);
                    JsonNode retryRootNode = objectMapper.readTree(retryJson);
                    return retryRootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                } catch (Exception retryEx) {
                    throw new BusinessException("Gemini API is currently overloaded (503 Service Unavailable). Please try again in a few minutes.");
                }
            }
            throw new BusinessException("Gemini API Error (Code: " + statusCode + ")");
        } catch (Exception e) {
            log.error("Unknown error when calling Gemini API: {}", e.getMessage(), e);
            throw new BusinessException("Unknown error when calling Gemini API. Please try again.");
        }
    }

    @Override
    public String evaluateDocumentContext(java.util.List<String> existingRequirementContexts, String documentText) {
        if (existingRequirementContexts == null || existingRequirementContexts.isEmpty()) {
            // Bootstrap Mode: No existing requirements to compare against, so pass safely.
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
    public String evaluateUseCasesWithCritic(String rawUseCasesJson, java.util.List<org.example.backend.entity.Requirement> requirements) {
        StringBuilder reqsContext = new StringBuilder();
        if (requirements != null) {
            for (org.example.backend.entity.Requirement r : requirements) {
                reqsContext.append("Requirement ID: ").append(r.getId()).append("\n");
                reqsContext.append("Title: ").append(r.getTitle()).append("\n");
                reqsContext.append("Description: ").append(r.getDescription()).append("\n");
                reqsContext.append("---\n");
            }
        }

        String prompt = "You are an extremely strict Senior QA / Business Analyst (AI Critic). " +
                "I will provide you with a list of recently generated Use Cases (in JSON format), " +
                "and their original parent Requirements.\n\n" +
                "Your task: Read each Use Case and evaluate its quality. " +
                "Return the EXACT SAME JSON array, but append 3 evaluation fields to EACH object:\n" +
                "1. 'quality_status': (String) Quality status, must be strictly one of: 'OK', 'Warning', 'Error'.\n" +
                "2. 'warnings': (Array of Strings) List any ambiguities, missing primary actors, or lack of details in ENGLISH (if any; empty array if none).\n" +
                "3. 'errors': (Array of Strings) List any logical errors, disconnected alternative flows, or contradictions in ENGLISH (if any; empty array if none).\n\n" +
                "ABSOLUTELY RETURN ONLY THE JSON ARRAY. NO ADDITIONAL COMMENTS.\n\n" +
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
