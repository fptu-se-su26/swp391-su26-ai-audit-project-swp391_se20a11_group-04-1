package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightAiProviderResult;
import org.example.backend.dto.CodeInsightAiReviewInput;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.exception.CodeInsightAiProviderException;
import org.example.backend.service.CodeInsightAiProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Component
@RequiredArgsConstructor
public class GeminiCodeInsightAiProvider implements CodeInsightAiProvider {
    private static final String PROVIDER = "GEMINI";
    private static final int PROMPT_PREVIEW_LIMIT = 4000;
    private static final Set<String> RECOMMENDATIONS = Set.of("LIKELY_READY", "NEEDS_REVIEW", "BLOCKED_RISK", "INSUFFICIENT_EVIDENCE");
    private static final Set<String> SEVERITIES = Set.of("INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL");
    private static final Set<String> CATEGORIES = Set.of(
            "EVIDENCE_GAP", "CI_FAILURE", "REQUIREMENT_MISMATCH", "TEST_COVERAGE", "SECURITY",
            "QUALITY", "SCOPE_RISK", "AUTHOR_MISMATCH", "LARGE_CHANGE");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${code-insight.ai.model:${CODE_INSIGHT_AI_MODEL:gemini-3.6-flash}}")
    private String model;

    @Value("${code-insight.ai.api-key:${CODE_INSIGHT_AI_API_KEY:}}")
    private String apiKey;

    @Value("${code-insight.ai.timeout-seconds:${CODE_INSIGHT_AI_TIMEOUT_SECONDS:30}}")
    private int timeoutSeconds;

    @Override
    public CodeInsightAiProviderResult review(CodeInsightAiReviewInput input) {
        if (apiKey == null || apiKey.isBlank()) {
            throw providerException(
                    "AI provider API key is not configured.",
                    "API_KEY_MISSING",
                    null,
                    0,
                    false,
                    null,
                    "Set CODE_INSIGHT_AI_API_KEY and restart the backend.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        String promptInputJson = writeJson(input);
        String prompt = buildPrompt(promptInputJson);
        JsonNode response = callGemini(prompt);
        CodeInsightAiReviewResponse parsed = parseResponseText(response);
        return toResult(parsed, promptInputJson, promptPreview(input));
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
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
        ResponseEntity<String> response;
        try {
            response = restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
        } catch (HttpStatusCodeException ex) {
            throw toProviderException(ex);
        } catch (Exception ex) {
            throw providerException(
                    "AI provider request failed.",
                    "PROVIDER_REQUEST_FAILED",
                    null,
                    0,
                    true,
                    null,
                    ex.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw providerException(
                    "AI provider returned an empty response.",
                    "EMPTY_RESPONSE",
                    null,
                    response.getStatusCode().value(),
                    true,
                    null,
                    "Gemini returned HTTP " + response.getStatusCode(),
                    HttpStatus.BAD_GATEWAY);
        }
        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception ex) {
            throw providerException(
                    "AI provider response could not be parsed.",
                    "PROVIDER_RESPONSE_INVALID",
                    null,
                    response.getStatusCode().value(),
                    true,
                    null,
                    ex.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
    }

    private void configureTimeouts() {
        ClientHttpRequestFactory factory = restTemplate.getRequestFactory();
        if (factory instanceof SimpleClientHttpRequestFactory simpleFactory) {
            int timeoutMillis = Math.max(1, timeoutSeconds) * 1000;
            simpleFactory.setConnectTimeout(timeoutMillis);
            simpleFactory.setReadTimeout(timeoutMillis);
        }
    }

    private CodeInsightAiReviewResponse parseResponseText(JsonNode response) {
        JsonNode textNode = response.at("/candidates/0/content/parts/0/text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new IllegalStateException("Gemini response did not contain text JSON");
        }
        try {
            CodeInsightAiReviewResponse parsed = objectMapper.readValue(stripCodeFence(textNode.asText()), CodeInsightAiReviewResponse.class);
            validate(parsed);
            return parsed;
        } catch (Exception ex) {
            throw providerException(
                    "AI provider returned invalid review JSON.",
                    "AI_JSON_INVALID",
                    null,
                    200,
                    true,
                    null,
                    ex.getMessage(),
                    HttpStatus.BAD_GATEWAY);
        }
    }

    private CodeInsightAiProviderResult toResult(CodeInsightAiReviewResponse response, String promptInputJson, String preview) {
        return CodeInsightAiProviderResult.builder()
                .provider(PROVIDER)
                .model(model)
                .recommendation(normalizeRecommendation(response.getRecommendation()))
                .confidence(clamp(response.getConfidence(), 0.0, 1.0))
                .scoreAdjustment((int) clamp(response.getScoreAdjustment(), -15, 15))
                .summary(defaultString(response.getSummary(), "Gemini returned a structured advisory review."))
                .riskDetails(normalizeRisks(response.getRiskDetails()))
                .questionsForLeader(response.getQuestionsForLeader() != null ? response.getQuestionsForLeader() : List.of())
                .evidenceAssessment(response.getEvidenceAssessment() != null ? response.getEvidenceAssessment() : CodeInsightAiReviewResponse.EvidenceAssessment.builder().build())
                .reviewNotes(response.getReviewNotes() != null ? response.getReviewNotes() : List.of())
                .promptInputJson(promptInputJson)
                .promptPreview(preview)
                .inputHash(sha256(promptInputJson))
                .build();
    }

    private void validate(CodeInsightAiReviewResponse response) {
        if (response == null) throw new IllegalArgumentException("AI response is null");
        response.setRecommendation(normalizeRecommendation(response.getRecommendation()));
        response.setConfidence(clamp(response.getConfidence(), 0.0, 1.0));
        response.setScoreAdjustment((int) clamp(response.getScoreAdjustment(), -15, 15));
        response.setRiskDetails(normalizeRisks(response.getRiskDetails()));
    }

    private List<CodeInsightAiReviewResponse.RiskDetail> normalizeRisks(List<CodeInsightAiReviewResponse.RiskDetail> risks) {
        if (risks == null) return List.of();
        return risks.stream().map(risk -> CodeInsightAiReviewResponse.RiskDetail.builder()
                .severity(SEVERITIES.contains(risk.getSeverity()) ? risk.getSeverity() : "MEDIUM")
                .category(CATEGORIES.contains(risk.getCategory()) ? risk.getCategory() : "QUALITY")
                .title(defaultString(risk.getTitle(), "AI risk"))
                .detail(defaultString(risk.getDetail(), risk.getTitle()))
                .build()).toList();
    }

    private String normalizeRecommendation(String recommendation) {
        return RECOMMENDATIONS.contains(recommendation) ? recommendation : "NEEDS_REVIEW";
    }

    private String buildPrompt(String promptInputJson) {
        // Prompt AI: Code Insight AI Review. Đóng vai trò AI Reviewer để phân tích task (mã nguồn thay đổi, commits, PRs, CI).
        // Đưa ra quyết định (recommendation), rủi ro (riskDetails), tóm tắt cho Leader, và liệt kê các đoạn code cần chú ý (reviewNotes).
        return """
                You are Code Insight AI Review. You are advisory only and must not approve or reject tasks.
                Return strict JSON only, with no Markdown, matching this schema:
                {
                  "recommendation": "LIKELY_READY|NEEDS_REVIEW|BLOCKED_RISK|INSUFFICIENT_EVIDENCE",
                  "confidence": 0.0,
                  "scoreAdjustment": 0,
                  "summary": "short leader-facing summary",
                  "riskDetails": [{"severity":"INFO|LOW|MEDIUM|HIGH|CRITICAL","category":"EVIDENCE_GAP|CI_FAILURE|REQUIREMENT_MISMATCH|TEST_COVERAGE|SECURITY|QUALITY|SCOPE_RISK|AUTHOR_MISMATCH|LARGE_CHANGE","title":"...","detail":"..."}],
                  "questionsForLeader": ["..."],
                  "evidenceAssessment": {"requirementLinked":false,"githubIssueLinked":false,"hasCommitEvidence":false,"hasPullRequestEvidence":false,"ciPassed":false,"authorMatchesAssignee":false,"changedFilesReviewed":0,"binaryFilesSkipped":0,"truncatedFiles":0},
                  "reviewNotes": [{"file":"...","severity":"INFO|LOW|MEDIUM|HIGH|CRITICAL","lineHint":null,"message":"..."}]
                }
                Clamp confidence to 0..1 and scoreAdjustment to -15..15. Flag uncertainty clearly.
                Review input JSON:
                """ + promptInputJson;
    }

    private String promptPreview(CodeInsightAiReviewInput input) {
        String preview = "Gemini review request\n"
                + "Task: " + input.getTask().getTitle() + "\n"
                + "Rule score: " + input.getRuleScore().getScore() + "/" + input.getRuleScore().getRiskLevel() + "\n"
                + "Evidence: " + input.getGithubEvidence().getCommits().size() + " commits, "
                + input.getGithubEvidence().getPullRequests().size() + " PRs, "
                + input.getGithubEvidence().getChecks().size() + " checks\n"
                + "Changed files sent: " + input.getChangedFiles().size() + "\n"
                + "Timeout seconds: " + timeoutSeconds;
        return preview.length() > PROMPT_PREVIEW_LIMIT ? preview.substring(0, PROMPT_PREVIEW_LIMIT) : preview;
    }

    private String stripCodeFence(String value) {
        String trimmed = value.trim();
        if (!trimmed.startsWith("```")) return trimmed;
        return trimmed.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "").trim();
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "{}";
        }
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private CodeInsightAiProviderException toProviderException(HttpStatusCodeException ex) {
        JsonNode error = parseError(ex.getResponseBodyAsString());
        int statusCode = ex.getStatusCode().value();
        String providerStatus = error.at("/error/status").asText(ex.getStatusText());
        String detail = error.at("/error/message").asText(ex.getMessage());
        Integer retryAfter = retryAfterSeconds(error);
        if (statusCode == 404) {
            return providerException("AI provider model is not available.", "MODEL_NOT_FOUND", providerStatus, statusCode, false, retryAfter, detail, HttpStatus.BAD_GATEWAY);
        }
        if (statusCode == 429) {
            return providerException("AI provider quota or rate limit was exceeded.", "QUOTA_EXCEEDED", providerStatus, statusCode, true, retryAfter, detail, HttpStatus.TOO_MANY_REQUESTS);
        }
        if (statusCode == 503) {
            return providerException("AI provider is temporarily unavailable.", "PROVIDER_UNAVAILABLE", providerStatus, statusCode, true, retryAfter, detail, HttpStatus.SERVICE_UNAVAILABLE);
        }
        return providerException("AI provider request failed.", "PROVIDER_REQUEST_FAILED", providerStatus, statusCode, statusCode >= 500, retryAfter, detail, HttpStatus.BAD_GATEWAY);
    }

    private JsonNode parseError(String json) {
        try {
            return json != null ? objectMapper.readTree(json) : objectMapper.createObjectNode();
        } catch (Exception ex) {
            return objectMapper.createObjectNode();
        }
    }

    private Integer retryAfterSeconds(JsonNode error) {
        JsonNode details = error.at("/error/details");
        if (!details.isArray()) return null;
        for (JsonNode detail : details) {
            String retryDelay = detail.at("/retryDelay").asText(null);
            if (retryDelay != null && retryDelay.endsWith("s")) {
                try {
                    return Integer.parseInt(retryDelay.substring(0, retryDelay.length() - 1));
                } catch (NumberFormatException ignored) {
                    return null;
                }
            }
        }
        return null;
    }

    private CodeInsightAiProviderException providerException(
            String message,
            String errorType,
            String providerStatus,
            int providerStatusCode,
            boolean retryable,
            Integer retryAfterSeconds,
            String detail,
            HttpStatus httpStatus) {
        return new CodeInsightAiProviderException(
                message,
                PROVIDER,
                model,
                errorType,
                providerStatus,
                providerStatusCode,
                retryable,
                retryAfterSeconds,
                detail,
                httpStatus);
    }
}
