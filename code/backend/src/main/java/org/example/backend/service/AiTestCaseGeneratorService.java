package org.example.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.testing.AiTestCaseGenerateRequest;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.testing.TestCaseRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.enums.TestType;
import org.example.backend.exception.BusinessException;
import org.example.backend.repository.RequirementRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class AiTestCaseGeneratorService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent}")
    private String geminiApiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final RequirementRepository requirementRepository;
    private final org.example.backend.repository.AiGenerationStagingRepository stagingRepository;

    public AiTestCaseGeneratorService(
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            RequirementRepository requirementRepository,
            org.example.backend.repository.AiGenerationStagingRepository stagingRepository) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.requirementRepository = requirementRepository;
        this.stagingRepository = stagingRepository;
    }

    public List<TestCaseRequest> generateTestCases(AiTestCaseGenerateRequest request) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException("Gemini API key is not configured.");
        }

        String requirementContext = "";
        if (request.getRequirementId() != null) {
            Requirement req = requirementRepository.findById(request.getRequirementId()).orElse(null);
            if (req != null) {
                validateAiGenerationConstraints(req);

                requirementContext = "Requirement Details:\n" +
                        "Title: " + req.getTitle() + "\n" +
                        "Description: " + req.getDescription() + "\n" +
                        "Acceptance Criteria: " + req.getAcceptanceCriteria() + "\n\n";
            }
        }

        String prompt = buildPrompt(request.getTestType(), request.isSmartMode(), requirementContext,
                request.getAdditionalContext());

        String url = geminiApiUrl + "?key=" + apiKey;

        Map<String, Object> payload = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        content.put("parts", List.of(part));
        payload.put("contents", List.of(content));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        payload.put("generationConfig", generationConfig);

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add("Content-Type", "application/json");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, httpHeaders);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            Map<String, Object> bodyMap = response.getBody();
            if (bodyMap != null && bodyMap.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) bodyMap.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> contentMap = (Map<String, Object>) candidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                    if (!parts.isEmpty()) {
                        String rawJson = (String) parts.get(0).get("text");
                        String cleanJson = rawJson.trim();
                        if (cleanJson.startsWith("```json")) {
                            cleanJson = cleanJson.substring(7);
                        }
                        if (cleanJson.endsWith("```")) {
                            cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
                        }
                        cleanJson = cleanJson.trim();

                        List<TestCaseRequest> generatedRequests = objectMapper.readValue(cleanJson,
                                new com.fasterxml.jackson.core.type.TypeReference<List<TestCaseRequest>>() {
                                });

                        for (TestCaseRequest generatedRequest : generatedRequests) {
                            if (!request.isSmartMode() && request.getTestType() != null) {
                                generatedRequest.setType(request.getTestType());
                            }
                            if (request.getRequirementId() != null) {
                                generatedRequest.setRequirementId(request.getRequirementId());
                            }
                        }
                        return generatedRequests;
                    }
                }
            }
            throw new BusinessException("Empty response from AI.");
        } catch (Exception e) {
            log.error("Failed to parse result from AI: ", e);
            throw new BusinessException("Không thể parse kết quả từ AI, vui lòng thử lại! Lỗi: " + e.getMessage());
        }
    }

    private String buildPrompt(TestType testType, boolean smartMode, String requirementContext, String additionalContext) {
        String basePrompt = "You are an elite QA Automation Architect. Your task is to analyze Software Requirements and their Acceptance Criteria to design comprehensive, production-ready Test Cases. " +
                "Generate between 3 and 8 comprehensive test cases depending on requirement complexity. " +
                "Cover: happy path, negative cases, edge cases, and boundary values.\n\n" +
                "CRITICAL RULES FOR TEST GENERATION:\n" +
                "1. Requirement Traceability: Every test case must directly validate at least one specific condition from the Acceptance Criteria.\n" +
                "2. Precondition Setup: Clearly define the system state required before the test begins.\n" +
                "3. Granular Action Mapping: Break down user workflows into atomic steps. Do not use generic steps like 'Login'. Specify the exact inputs, buttons, and navigation paths.\n" +
                "4. Mandatory Verification: The final step of EVERY test case MUST be a verification step asserting the Expected Result (e.g., verifying an error message, a state change, or a URL redirect). A test without an explicit assertion is a failed test.\n\n";

        if (smartMode) {
            basePrompt += "For each test case, choose the most appropriate test type from: UI, API, MANUAL. Include the 'type' field in each test case JSON.\n\n";
        } else if (testType != null) {
            basePrompt += "Generate test cases matching the requested test type: " + testType.name() + ".\n\n";
        }

        basePrompt += "UI TEST CONSTRAINTS (stepsStructured):\n" +
                "- 'stepsStructured' must perfectly mirror the human-readable 'steps' array.\n" +
                "- Allowed Actions: 'goto' (requires 'path'), 'fill' (requires 'selector', 'value'), 'click' (requires 'selector'), 'select' (requires 'selector', 'value'), 'wait_for' (requires 'selector').\n" +
                "- Allowed Assertions (CRITICAL): You MUST append assertion actions at the end of the array to verify the result. Use 'expect_url' (requires 'expected'), 'expect_text' (requires 'selector', 'expected'), 'expect_visible' (requires 'selector'), or 'expect_hidden' (requires 'selector').\n\n";

        basePrompt += "Only return a valid JSON array matching this exact structure (NO markdown code blocks, NO extra text):\n\n";

        String structure = "[\n" +
                "  {\n" +
                "    \"title\": \"Login fails with unregistered email\",\n" +
                "    \"type\": \"UI\",\n" +
                "    \"precondition\": \"User is on the login page. The email 'unregistered@abc.com' does not exist in the database.\",\n" +
                "    \"expectedResult\": \"System displays a validation error message 'Invalid credentials'.\",\n" +
                "    \"baseUrl\": \"https://example.com/login\",\n" +
                "    \"stepsStructured\": [\n" +
                "      { \"action\": \"goto\", \"path\": \"/login\" },\n" +
                "      { \"action\": \"fill\", \"selector\": \"input[name='email']\", \"value\": \"unregistered@abc.com\" },\n" +
                "      { \"action\": \"fill\", \"selector\": \"input[name='password']\", \"value\": \"AnyPassword123!\" },\n" +
                "      { \"action\": \"click\", \"selector\": \"button[type='submit']\" },\n" +
                "      { \"action\": \"wait_for\", \"selector\": \".error-toast\" },\n" +
                "      { \"action\": \"expect_visible\", \"selector\": \".error-toast\" },\n" +
                "      { \"action\": \"expect_text\", \"selector\": \".error-toast\", \"expected\": \"Invalid credentials\" }\n" +
                "    ],\n" +
                "    \"steps\": [\n" +
                "      { \"stepNumber\": 1, \"description\": \"Navigate to the login page (/login)\" },\n" +
                "      { \"stepNumber\": 2, \"description\": \"Enter an unregistered email address (e.g., unregistered@abc.com) into the Email field\" },\n" +
                "      { \"stepNumber\": 3, \"description\": \"Enter any password into the Password field\" },\n" +
                "      { \"stepNumber\": 4, \"description\": \"Click the Submit button\" },\n" +
                "      { \"stepNumber\": 5, \"description\": \"Verify that an error toast message appears with the text 'Invalid credentials'\" }\n" +
                "    ]\n" +
                "  },\n" +
                "  {\n" +
                "    \"title\": \"Test name API\",\n" +
                "    \"type\": \"API\",\n" +
                "    \"precondition\": \"Description\",\n" +
                "    \"expectedResult\": \"Returns 200 OK and JWT token in response body\",\n" +
                "    \"apiMethod\": \"POST\",\n" +
                "    \"apiUrl\": \"/api/v1/auth/login\",\n" +
                "    \"apiHeaders\": { \"Content-Type\": \"application/json\" },\n" +
                "    \"apiBody\": { \"email\": \"test@abc.com\", \"password\": \"123\" },\n" +
                "    \"apiAssertions\": [\n" +
                "      { \"target\": \"status\", \"operator\": \"equals\", \"value\": 200 }\n" +
                "    ],\n" +
                "    \"steps\": [\n" +
                "      { \"stepNumber\": 1, \"description\": \"Send POST request to login endpoint\" }\n" +
                "    ]\n" +
                "  }\n" +
                "]";

        return basePrompt + structure + "\n\n" +
                (requirementContext != null && !requirementContext.isEmpty() ? requirementContext : "") + "\n" +
                "Additional Context/Instructions:\n" +
                (additionalContext != null && !additionalContext.isEmpty() ? additionalContext : "None");
    }

    private void validateAiGenerationConstraints(Requirement req) {
        if (req.getProject() == null || req.getProject().getId() == null)
            return;

        List<org.example.backend.entity.AiGenerationStaging> recentStagings = stagingRepository
                .findRecentByRequirementId(req.getProject().getId(), req.getId());

        if (recentStagings.isEmpty())
            return;

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime reqUpdated = req.getUpdatedAt() != null ? req.getUpdatedAt() : req.getCreatedAt();

        // 1. Lazy Expire PENDING + Staging Check
        for (org.example.backend.entity.AiGenerationStaging stg : recentStagings) {
            if (stg.getStatus() == org.example.backend.entity.AiGenerationStatus.PENDING) {
                if (reqUpdated != null && reqUpdated.isAfter(stg.getCreatedAt())) {
                    // Requirement has been updated, auto-reject old pending
                    stg.setStatus(org.example.backend.entity.AiGenerationStatus.DISCARDED);
                    stagingRepository.save(stg);
                    log.info("Auto-rejected obsolete PENDING staging {} for requirement {}", stg.getId(), req.getId());
                } else {
                    throw new BusinessException(
                            "You have an unreviewed PENDING generation for this requirement. Please review or reject it first.");
                }
            }
        }

        // 2. Cooldown Check (1 minute)
        org.example.backend.entity.AiGenerationStaging latest = recentStagings.get(0);
        if (latest.getCreatedAt().plusMinutes(1).isAfter(now)) {
            throw new BusinessException(
                    "Please wait at least 1 minute before generating test cases for this requirement again.");
        }

        // 3. Daily Quota Check (Max 3 times per day per HCM timezone)
        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        java.time.LocalDate today = java.time.ZonedDateTime.now(zoneId).toLocalDate();

        long countToday = recentStagings.stream().filter(stg -> stg.getCreatedAt().atZone(java.time.ZoneId.of("UTC"))
                .withZoneSameInstant(zoneId).toLocalDate().equals(today)).count();

        if (countToday >= 3) {
            // Check if Requirement was updated after the latest generation
            if (reqUpdated != null && reqUpdated.isAfter(latest.getCreatedAt())) {
                log.info("Quota limit reached (3/day) but requirement {} was updated. Resetting quota.", req.getId());
            } else {
                throw new BusinessException(
                        "Daily generation quota reached (3 times) for this requirement. Please try again tomorrow or update the requirement.");
            }
        }
    }
}
