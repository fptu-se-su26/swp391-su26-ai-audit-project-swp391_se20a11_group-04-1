package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.CodePatchAnalysisResult;
import org.example.backend.dto.ReqDiffAlignmentResult;
import org.example.backend.service.ReqDiffAlignmentService;
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
@Slf4j
public class ReqDiffAlignmentServiceImpl implements ReqDiffAlignmentService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${code-insight.ai.model:${CODE_INSIGHT_AI_MODEL:gemini-3.6-flash}}")
    private String model;

    @Value("${code-insight.ai.api-key:${CODE_INSIGHT_AI_API_KEY:}}")
    private String apiKey;

    @Value("${code-insight.ai.timeout-seconds:${CODE_INSIGHT_AI_TIMEOUT_SECONDS:30}}")
    private int timeoutSeconds;

    @Override
    public ReqDiffAlignmentResult align(CodePatchAnalysisResult patchAnalysis, List<String> acceptanceCriteria) {
        if (acceptanceCriteria == null || acceptanceCriteria.isEmpty()) {
            return emptyResult();
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.warn("AI API Key is not configured. Returning empty alignment result.");
            return emptyResult();
        }

        try {
            String patchJson = objectMapper.writeValueAsString(patchAnalysis);
            String prompt = buildPrompt(patchJson, acceptanceCriteria);
            JsonNode responseNode = callGemini(prompt);
            return parseResponse(responseNode);
        } catch (Exception ex) {
            log.error("Failed to perform requirement-diff alignment via Gemini: ", ex);
            return emptyResult();
        }
    }

    private ReqDiffAlignmentResult emptyResult() {
        return ReqDiffAlignmentResult.builder()
                .alignmentMatrix(Collections.emptyList())
                .coverageRatio(0.0)
                .coveredCount(0)
                .totalCount(0)
                .finalRiskLevel("LOW")
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
                        "temperature", 0.1,
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

    private ReqDiffAlignmentResult parseResponse(JsonNode responseNode) {
        JsonNode textNode = responseNode.at("/candidates/0/content/parts/0/text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new IllegalStateException("Gemini response did not contain text JSON");
        }

        try {
            String cleanJson = stripCodeFence(textNode.asText());
            return objectMapper.readValue(cleanJson, ReqDiffAlignmentResult.class);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to map JSON response to ReqDiffAlignmentResult DTO", ex);
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

    private String buildPrompt(String patchJson, List<String> acceptanceCriteria) {
        StringBuilder acText = new StringBuilder();
        for (int i = 0; i < acceptanceCriteria.size(); i++) {
            acText.append(String.format("AC-%d: %s\n", i + 1, acceptanceCriteria.get(i)));
        }

        // Prompt AI: Đối chiếu (Align) các thay đổi mã nguồn đã phân tích với danh sách Tiêu chí chấp nhận (Acceptance Criteria).
        // Đánh giá tỷ lệ hoàn thành (Coverage) và tính toán rủi ro (Risk Level) của các thay đổi đó.
        return """
                You are an AI Technical Lead. Align the parsed physical/behavioral code changes (Component A) with the Acceptance Criteria (AC) of the requirement.
                Also evaluate logic, security, and quality risks on the modified files to output a risk level (finalRiskLevel).

                Input 1: Parsed Code Changes (Component A JSON)
                """ + patchJson + """
                
                Input 2: Acceptance Criteria List
                """ + acText.toString() + """
                
                Align the changes against each AC. Output strictly in JSON format matching this schema:
                {
                  "alignmentMatrix": [
                    {
                      "acText": "User can reset password",
                      "status": "FULLY_COVERED|PARTIAL|NOT_FOUND",
                      "evidenceDetail": "AuthService.java:resetPassword method implements the password reset logic",
                      "feedback": "Fully implemented"
                    }
                  ],
                  "coverageRatio": 0.8,
                  "coveredCount": 4,
                  "totalCount": 5,
                  "finalRiskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
                }

                Strict rules for status mapping:
                - FULLY_COVERED: There is clear evidence in the code changes implementing this specific AC.
                - PARTIAL: The AC is partly implemented, but some parts are hardcoded, missing validation, or left unfinished.
                - NOT_FOUND: No code changes relate to this AC.

                Strict rules for finalRiskLevel:
                - CRITICAL: Major security flaws (SQL injection, hardcoded auth, missing token check) or broken critical flows.
                - HIGH: Significant technical risks (N+1 query, unhandled exception in sensitive flow, poor performance).
                - MEDIUM: Moderate risks, partial AC coverage, or small code smells.
                - LOW: Standard clean code changes matching the AC.

                Ensure all JSON fields are populated. Do not include markdown formatting or backticks around JSON output.
                """;
    }
}
