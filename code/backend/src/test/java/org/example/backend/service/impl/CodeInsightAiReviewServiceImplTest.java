package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.entity.CodeInsightAiReview;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CodeInsightAiReviewServiceImplTest {

    private final CodeInsightAiReviewServiceImpl service = new CodeInsightAiReviewServiceImpl(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            new ObjectMapper(),
            null,
            null,
            null);

    @Test
    void legacyReviewMapsToStructuredResponse() {
        CodeInsightAiReview review = CodeInsightAiReview.builder()
                .id(7L)
                .provider("LOCAL_RULE_ASSISTANT")
                .recommendation("REVIEW_CAREFULLY")
                .confidence(70)
                .summary("Legacy summary")
                .risksJson("[\"Old risk\"]")
                .reviewQuestionsJson("[\"Old question?\"]")
                .scoreAdjustment(0)
                .build();

        CodeInsightAiReviewResponse response = service.toResponse(review);

        assertThat(response.isLegacy()).isTrue();
        assertThat(response.getRecommendation()).isEqualTo("NEEDS_REVIEW");
        assertThat(response.getConfidence()).isEqualTo(0.70);
        assertThat(response.getRiskDetails()).hasSize(1);
        assertThat(response.getRiskDetails().get(0).getTitle()).isEqualTo("Old risk");
        assertThat(response.getQuestionsForLeader()).containsExactly("Old question?");
    }
}
