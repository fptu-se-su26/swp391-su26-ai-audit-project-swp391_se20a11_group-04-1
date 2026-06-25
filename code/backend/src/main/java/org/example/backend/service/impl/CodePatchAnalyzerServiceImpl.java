package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodePatchAnalysisResult;
import org.example.backend.service.CodePatchAnalyzerService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CodePatchAnalyzerServiceImpl implements CodePatchAnalyzerService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${code-insight.ai.model:${CODE_INSIGHT_AI_MODEL:gemini-2.5-flash}}")
    private String model;

    @Value("${code-insight.ai.api-key:${CODE_INSIGHT_AI_API_KEY:}}")
    private String apiKey;

    @Value("${code-insight.ai.timeout-seconds:${CODE_INSIGHT_AI_TIMEOUT_SECONDS:30}}")
    private int timeoutSeconds;

    @Override
    public CodePatchAnalysisResult analyzePatch(String rawDiff) {
        if (rawDiff == null || rawDiff.trim().isEmpty()) {
            return emptyResult();
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("AI provider API key is not configured.");
        }

        String prompt = buildPrompt(rawDiff);
        JsonNode responseNode = callGemini(prompt);
        return parseResponse(responseNode);
    }

    private CodePatchAnalysisResult emptyResult() {
        return CodePatchAnalysisResult.builder()
                .physicalChanges(Collections.emptyList())
                .methodSignatures(Collections.emptyList())
                .communicationChanges(CodePatchAnalysisResult.CommunicationChanges.builder()
                        .exposedEndpoints(Collections.emptyList())
                        .databaseColumnsAdded(Collections.emptyList())
                        .externalApisCalled(Collections.emptyList())
                        .build())
                .logicFlows(Collections.emptyList())
                .complexityDelta(Collections.emptyList())
                .build();
    }

    private JsonNode callGemini(String prompt) {
        configureTimeouts();
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "responseMimeType", "application/json"));

        ResponseEntity<String> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                new HttpEntity<>(body, headers), 
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Gemini API call failed with status: " + response.getStatusCode());
        }

        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to parse Gemini response tree", ex);
        }
    }

    private CodePatchAnalysisResult parseResponse(JsonNode responseNode) {
        JsonNode textNode = responseNode.at("/candidates/0/content/parts/0/text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new IllegalStateException("Gemini response did not contain text JSON");
        }

        try {
            String cleanJson = stripCodeFence(textNode.asText());
            return objectMapper.readValue(cleanJson, CodePatchAnalysisResult.class);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to map JSON response to CodePatchAnalysisResult DTO", ex);
        }
    }

    private String stripCodeFence(String value) {
        String trimmed = value.trim();
        if (!trimmed.startsWith("```")) return trimmed;
        return trimmed.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "").trim();
    }

    private void configureTimeouts() {
        ClientHttpRequestFactory factory = restTemplate.getRequestFactory();
        if (factory instanceof SimpleClientHttpRequestFactory simpleFactory) {
            int timeoutMillis = Math.max(1, timeoutSeconds) * 1000;
            simpleFactory.setConnectTimeout(timeoutMillis);
            simpleFactory.setReadTimeout(timeoutMillis);
        }
    }

    private String buildPrompt(String rawDiff) {
        // Prompt AI: Phân tích chuyên sâu (Deep Code Analyzer) đoạn mã thay đổi (git diff).
        // Trích xuất các thay đổi vật lý, chữ ký hàm, API được public, DB được thêm/sửa, và các luồng logic để đánh giá độ phức tạp.
        return """
                You are a Deep Code Analyzer. Parse the raw git diff and extract physical changes, method signatures, exposed APIs, DB entities/columns, logic flows, and complexity delta.
                Analyze the diff thoroughly and output strictly in JSON format matching this schema:
                {
                  "physicalChanges": [
                    {
                      "filePath": "src/main/java/...",
                      "action": "ADDED|MODIFIED|DELETED",
                      "fileType": "java|sql|xml|yaml|..."
                    }
                  ],
                  "methodSignatures": [
                    {
                      "className": "AuthService",
                      "methodName": "login",
                      "signature": "public LoginResponse login(LoginRequest request)",
                      "changeType": "ADDED|MODIFIED"
                    }
                  ],
                  "communicationChanges": {
                    "exposedEndpoints": ["POST /api/v1/auth/login"],
                    "databaseColumnsAdded": ["users.password_reset_token"],
                    "externalApisCalled": ["https://api.github.com/repos"]
                  },
                  "logicFlows": [
                    {
                      "file": "AuthService.java",
                      "description": "Added if-else block to check token expiry",
                      "sideEffects": "Throws ExpiredTokenException when token is past 15 minutes"
                    }
                  ],
                  "complexityDelta": [
                    {
                      "className": "AuthService",
                      "methodName": "login",
                      "estimatedIncrease": 2,
                      "reason": "Added nested conditional statement and exception handling"
                    }
                  ]
                }
                
                If a section has no data, return empty list/object. Do not include markdown formatting or backticks around JSON output.
                
                Git Diff:
                """ + rawDiff;
    }
}
