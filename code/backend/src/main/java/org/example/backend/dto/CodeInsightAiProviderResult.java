package org.example.backend.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightAiProviderResult {
    private String provider;
    private String model;
    private String recommendation;
    private double confidence;
    private int scoreAdjustment;
    private String summary;
    private List<CodeInsightAiReviewResponse.RiskDetail> riskDetails;
    private List<String> questionsForLeader;
    private CodeInsightAiReviewResponse.EvidenceAssessment evidenceAssessment;
    private List<CodeInsightAiReviewResponse.ReviewNote> reviewNotes;
    private Map<String, Object> providerError;
    private String promptInputJson;
    private String promptPreview;
    private String inputHash;
}
