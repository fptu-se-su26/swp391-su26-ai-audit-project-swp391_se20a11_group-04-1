package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightAiProviderResult;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.CodeInsightAiReview;
import org.example.backend.entity.Task;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.CodeInsightAiReviewRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.CodeInsightAiProvider;
import org.example.backend.service.CodeInsightAiReviewInputBuilder;
import org.example.backend.service.CodeInsightAiReviewService;
import org.example.backend.service.CodeInsightScoringService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CodeInsightAiReviewServiceImpl implements CodeInsightAiReviewService {

    private final TaskRepository taskRepository;
    private final CodeInsightScoringService scoringService;
    private final CodeInsightAiReviewInputBuilder inputBuilder;
    private final CodeInsightAiProvider aiProvider;
    private final CodeInsightAiReviewRepository aiReviewRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public CodeInsightAiReviewResponse createReview(Long projectId, Long taskId, Long userId) {
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
        if (task.getProject() == null || !projectId.equals(task.getProject().getId())) {
            throw new CustomException("Task does not belong to this project", HttpStatus.BAD_REQUEST);
        }

        TaskReviewDecisionResponse.ReviewEvidenceSummary score = scoringService.buildReviewEvidenceSummary(task);
        CodeInsightAiProviderResult result = aiProvider.review(inputBuilder.build(task, score));

        CodeInsightAiReview saved = aiReviewRepository.save(CodeInsightAiReview.builder()
                .task(task)
                .provider(result.getProvider())
                .model(result.getModel())
                .recommendation(result.getRecommendation())
                .confidence(toPercent(result.getConfidence()))
                .summary(result.getSummary())
                .promptInputJson(result.getPromptInputJson())
                .promptPreview(result.getPromptPreview())
                .inputHash(result.getInputHash())
                .riskDetailsJson(writeJson(result.getRiskDetails()))
                .questionsForLeaderJson(writeJson(result.getQuestionsForLeader()))
                .evidenceAssessmentJson(writeJson(result.getEvidenceAssessment()))
                .reviewNotesJson(writeJson(result.getReviewNotes()))
                .providerErrorJson(writeJson(result.getProviderError()))
                .scoreAdjustment(clampAdjustment(result.getScoreAdjustment()))
                .build());
        return toResponse(saved);
    }

    public CodeInsightAiReviewResponse toResponse(CodeInsightAiReview review) {
        if (review == null) return null;
        List<CodeInsightAiReviewResponse.RiskDetail> riskDetails = readRiskDetails(review);
        List<String> questions = readQuestions(review);
        CodeInsightAiReviewResponse.EvidenceAssessment assessment = readValue(
                review.getEvidenceAssessmentJson(),
                CodeInsightAiReviewResponse.EvidenceAssessment.class,
                emptyAssessment());
        List<CodeInsightAiReviewResponse.ReviewNote> notes = readList(
                review.getReviewNotesJson(),
                new TypeReference<List<CodeInsightAiReviewResponse.ReviewNote>>() {});
        Map<String, Object> providerError = readMap(review.getProviderErrorJson());
        boolean legacy = review.getRiskDetailsJson() == null && (review.getRisksJson() != null || review.getReviewQuestionsJson() != null);

        return CodeInsightAiReviewResponse.builder()
                .id(review.getId())
                .provider(review.getProvider())
                .model(review.getModel())
                .recommendation(mapRecommendation(review.getRecommendation()))
                .confidence(review.getConfidence() / 100.0)
                .summary(review.getSummary())
                .riskDetails(riskDetails)
                .questionsForLeader(questions)
                .evidenceAssessment(assessment)
                .reviewNotes(notes)
                .providerError(providerError)
                .legacy(legacy)
                .scoreAdjustment(review.getScoreAdjustment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CodeInsightAiReviewResponse getLatestReview(Long taskId) {
        return aiReviewRepository.findTopByTaskIdOrderByCreatedAtDesc(taskId)
                .map(this::toResponse)
                .orElse(null);
    }

    private List<CodeInsightAiReviewResponse.RiskDetail> readRiskDetails(CodeInsightAiReview review) {
        List<CodeInsightAiReviewResponse.RiskDetail> structured = readList(
                review.getRiskDetailsJson(),
                new TypeReference<List<CodeInsightAiReviewResponse.RiskDetail>>() {});
        if (!structured.isEmpty() || review.getRisksJson() == null) return structured;
        return readList(review.getRisksJson(), new TypeReference<List<String>>() {}).stream()
                .map(risk -> CodeInsightAiReviewResponse.RiskDetail.builder()
                        .severity("MEDIUM")
                        .category("QUALITY")
                        .title(risk)
                        .detail(risk)
                        .build())
                .toList();
    }

    private List<String> readQuestions(CodeInsightAiReview review) {
        List<String> structured = readList(review.getQuestionsForLeaderJson(), new TypeReference<List<String>>() {});
        return !structured.isEmpty() || review.getReviewQuestionsJson() == null
                ? structured
                : readList(review.getReviewQuestionsJson(), new TypeReference<List<String>>() {});
    }

    private String mapRecommendation(String recommendation) {
        if ("NEEDS_CHANGES".equals(recommendation)) return "BLOCKED_RISK";
        if ("REVIEW_CAREFULLY".equals(recommendation)) return "NEEDS_REVIEW";
        if (recommendation == null || recommendation.isBlank()) return "NEEDS_REVIEW";
        return recommendation;
    }

    private CodeInsightAiReviewResponse.EvidenceAssessment emptyAssessment() {
        return CodeInsightAiReviewResponse.EvidenceAssessment.builder().build();
    }

    private int toPercent(double confidence) {
        return Math.max(0, Math.min(100, (int) Math.round(confidence * 100)));
    }

    private int clampAdjustment(int value) {
        return Math.max(-15, Math.min(15, value));
    }

    private String writeJson(Object value) {
        try {
            return value == null ? null : objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private <T> List<T> readList(String json, TypeReference<List<T>> type) {
        try {
            return json != null ? objectMapper.readValue(json, type) : List.of();
        } catch (Exception ex) {
            return List.of();
        }
    }

    private <T> T readValue(String json, Class<T> type, T fallback) {
        try {
            return json != null ? objectMapper.readValue(json, type) : fallback;
        } catch (Exception ex) {
            return fallback;
        }
    }

    private Map<String, Object> readMap(String json) {
        try {
            return json != null ? objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {}) : null;
        } catch (Exception ex) {
            return null;
        }
    }
}
