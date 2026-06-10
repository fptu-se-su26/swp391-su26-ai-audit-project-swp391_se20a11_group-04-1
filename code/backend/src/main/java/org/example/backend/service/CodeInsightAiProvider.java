package org.example.backend.service;

import org.example.backend.dto.CodeInsightAiProviderResult;
import org.example.backend.dto.CodeInsightAiReviewInput;

public interface CodeInsightAiProvider {
    CodeInsightAiProviderResult review(CodeInsightAiReviewInput input);
}
