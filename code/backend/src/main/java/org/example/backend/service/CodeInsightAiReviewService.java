package org.example.backend.service;

import org.example.backend.dto.CodeInsightAiReviewResponse;

public interface CodeInsightAiReviewService {
    CodeInsightAiReviewResponse createReview(Long projectId, Long taskId, Long userId);

    CodeInsightAiReviewResponse getLatestReview(Long taskId);
}
