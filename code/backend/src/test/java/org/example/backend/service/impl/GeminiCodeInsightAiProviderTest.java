package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.CodeInsightAiProviderResult;
import org.example.backend.dto.CodeInsightAiReviewInput;
import org.example.backend.exception.CodeInsightAiProviderException;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GeminiCodeInsightAiProviderTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void geminiJsonIsParsedAndClamped() throws Exception {
        RestTemplate restTemplate = mock(RestTemplate.class);
        GeminiCodeInsightAiProvider provider = new GeminiCodeInsightAiProvider(restTemplate, objectMapper);
        ReflectionTestUtils.setField(provider, "apiKey", "test-key");
        ReflectionTestUtils.setField(provider, "model", "gemini-test");
        ReflectionTestUtils.setField(provider, "timeoutSeconds", 30);

        String aiJson = """
                {
                  "recommendation": "LIKELY_READY",
                  "confidence": 1.7,
                  "scoreAdjustment": 99,
                  "summary": "Looks ready.",
                  "riskDetails": [{"severity":"UNKNOWN","category":"OTHER","title":"Odd risk","detail":"Odd detail"}],
                  "questionsForLeader": ["Does it satisfy AC?"],
                  "evidenceAssessment": {"requirementLinked":true,"githubIssueLinked":true,"hasCommitEvidence":true,"hasPullRequestEvidence":true,"ciPassed":true,"authorMatchesAssignee":true,"changedFilesReviewed":1,"binaryFilesSkipped":0,"truncatedFiles":0},
                  "reviewNotes": [{"file":"src/App.java","severity":"INFO","lineHint":null,"message":"Reviewed."}]
                }
                """;
        String geminiResponse = """
                {"candidates":[{"content":{"parts":[{"text":%s}]}}]}
                """.formatted(objectMapper.writeValueAsString(aiJson));
        when(restTemplate.exchange(anyString(), any(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(geminiResponse));

        CodeInsightAiProviderResult result = provider.review(input());

        assertThat(result.getProvider()).isEqualTo("GEMINI");
        assertThat(result.getModel()).isEqualTo("gemini-test");
        assertThat(result.getConfidence()).isEqualTo(1.0);
        assertThat(result.getScoreAdjustment()).isEqualTo(15);
        assertThat(result.getRiskDetails().get(0).getSeverity()).isEqualTo("MEDIUM");
        assertThat(result.getRiskDetails().get(0).getCategory()).isEqualTo("QUALITY");
    }

    @Test
    void quotaErrorReturnsStructuredProviderException() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        GeminiCodeInsightAiProvider provider = new GeminiCodeInsightAiProvider(restTemplate, objectMapper);
        ReflectionTestUtils.setField(provider, "apiKey", "test-key");
        ReflectionTestUtils.setField(provider, "model", "gemini-test");
        ReflectionTestUtils.setField(provider, "timeoutSeconds", 30);
        String errorJson = """
                {"error":{"code":429,"message":"Quota exceeded","status":"RESOURCE_EXHAUSTED","details":[{"retryDelay":"28s"}]}}
                """;
        when(restTemplate.exchange(anyString(), any(), any(), eq(String.class)))
                .thenThrow(HttpClientErrorException.create(
                        org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                        "Too Many Requests",
                        org.springframework.http.HttpHeaders.EMPTY,
                        errorJson.getBytes(),
                        java.nio.charset.StandardCharsets.UTF_8));

        assertThatThrownBy(() -> provider.review(input()))
                .isInstanceOf(CodeInsightAiProviderException.class)
                .extracting("errorType", "retryable", "retryAfterSeconds")
                .containsExactly("QUOTA_EXCEEDED", true, 28);
    }

    private CodeInsightAiReviewInput input() {
        return CodeInsightAiReviewInput.builder()
                .task(CodeInsightAiReviewInput.TaskInput.builder().id(1L).title("Gemini task").build())
                .ruleScore(CodeInsightAiReviewInput.RuleScoreInput.builder()
                        .score(100)
                        .riskLevel("READY")
                        .ciStatus("PASSED")
                        .warnings(List.of())
                        .positiveSignals(List.of())
                        .scoreBreakdown(List.of())
                        .build())
                .githubEvidence(CodeInsightAiReviewInput.GitHubEvidenceInput.builder()
                        .commits(List.of(CodeInsightAiReviewInput.CommitInput.builder().sha("abc").build()))
                        .pullRequests(List.of(CodeInsightAiReviewInput.PullRequestInput.builder().number(1).build()))
                        .checks(List.of())
                        .build())
                .changedFiles(List.of())
                .build();
    }
}
