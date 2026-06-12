package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightAiProviderResult;
import org.example.backend.dto.CodeInsightAiReviewInput;
import org.example.backend.exception.CodeInsightAiProviderException;
import org.example.backend.service.CodeInsightAiProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
@Primary
@RequiredArgsConstructor
public class DelegatingCodeInsightAiProvider implements CodeInsightAiProvider {
    private final GeminiCodeInsightAiProvider geminiProvider;

    @Value("${code-insight.ai.provider:${CODE_INSIGHT_AI_PROVIDER:gemini}}")
    private String configuredProvider;

    @Value("${code-insight.ai.model:${CODE_INSIGHT_AI_MODEL:gemini-2.0-flash}}")
    private String configuredModel;

    @Override
    public CodeInsightAiProviderResult review(CodeInsightAiReviewInput input) {
        if (!"gemini".equalsIgnoreCase(configuredProvider)) {
            throw new CodeInsightAiProviderException(
                    "AI review requires a real AI provider. Configure CODE_INSIGHT_AI_PROVIDER=gemini.",
                    "CODE_INSIGHT",
                    configuredModel,
                    "PROVIDER_NOT_CONFIGURED",
                    null,
                    0,
                    false,
                    null,
                    "AI Review only runs against the configured real provider. Leaders can still use Code Insight rule score and evidence manually.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (!geminiProvider.isConfigured()) {
            throw new CodeInsightAiProviderException(
                    "AI provider API key is not configured.",
                    "GEMINI",
                    configuredModel,
                    "API_KEY_MISSING",
                    null,
                    0,
                    false,
                    null,
                    "Set CODE_INSIGHT_AI_API_KEY and restart the backend.",
                    HttpStatus.SERVICE_UNAVAILABLE);
        }
        return geminiProvider.review(input);
    }
}
