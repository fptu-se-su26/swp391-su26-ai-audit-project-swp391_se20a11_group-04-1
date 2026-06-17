package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.CodeInsightAiReviewInput;
import org.example.backend.exception.CodeInsightAiProviderException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DelegatingCodeInsightAiProviderTest {

    @Test
    void geminiWithoutKeyReturnsStructuredProviderErrorWithoutFallback() {
        GeminiCodeInsightAiProvider gemini = new GeminiCodeInsightAiProvider(new RestTemplate(), new ObjectMapper());
        ReflectionTestUtils.setField(gemini, "apiKey", "");
        ReflectionTestUtils.setField(gemini, "model", "gemini-test");
        DelegatingCodeInsightAiProvider delegating = new DelegatingCodeInsightAiProvider(gemini);
        ReflectionTestUtils.setField(delegating, "configuredProvider", "gemini");
        ReflectionTestUtils.setField(delegating, "configuredModel", "gemini-test");

        assertThatThrownBy(() -> delegating.review(input()))
                .isInstanceOf(CodeInsightAiProviderException.class)
                .extracting("errorType")
                .isEqualTo("API_KEY_MISSING");
    }

    @Test
    void nonGeminiConfigIsRejectedForAiReview() {
        GeminiCodeInsightAiProvider gemini = new GeminiCodeInsightAiProvider(new RestTemplate(), new ObjectMapper());
        DelegatingCodeInsightAiProvider delegating = new DelegatingCodeInsightAiProvider(gemini);
        ReflectionTestUtils.setField(delegating, "configuredProvider", "disabled");
        ReflectionTestUtils.setField(delegating, "configuredModel", "gemini-test");

        assertThatThrownBy(() -> delegating.review(input()))
                .isInstanceOf(CodeInsightAiProviderException.class)
                .extracting("errorType")
                .isEqualTo("PROVIDER_NOT_CONFIGURED");
    }

    private CodeInsightAiReviewInput input() {
        return CodeInsightAiReviewInput.builder()
                .task(CodeInsightAiReviewInput.TaskInput.builder().id(1L).title("Fallback task").build())
                .ruleScore(CodeInsightAiReviewInput.RuleScoreInput.builder()
                        .score(60)
                        .riskLevel("WARNING")
                        .ciStatus("NO_CI")
                        .warnings(List.of())
                        .positiveSignals(List.of())
                        .scoreBreakdown(List.of())
                        .build())
                .githubEvidence(CodeInsightAiReviewInput.GitHubEvidenceInput.builder()
                        .commits(List.of())
                        .pullRequests(List.of())
                        .checks(List.of())
                        .build())
                .changedFiles(List.of())
                .build();
    }
}
