package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.CodeInsightAiProviderResult;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.dto.CodePatchAnalysisResult;
import org.example.backend.dto.ReqDiffAlignmentResult;
import org.example.backend.entity.CodeInsightAiReview;
import org.example.backend.entity.CodeInsightEvidenceLink;
import org.example.backend.entity.CodeInsightEvidenceType;
import org.example.backend.entity.ProjectCodeInsightSettings;
import org.example.backend.entity.Task;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.GitHubPullRequestFile;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.CodeInsightAiReviewRepository;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.GitHubPullRequestFileRepository;
import org.example.backend.repository.ProjectCodeInsightSettingsRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.service.CodeInsightPatchService;
import org.example.backend.service.CodeInsightAiProvider;
import org.example.backend.service.CodeInsightAiReviewInputBuilder;
import org.example.backend.service.CodeInsightAiReviewService;
import org.example.backend.service.CodeInsightScoringService;
import org.example.backend.service.CodePatchAnalyzerService;
import org.example.backend.service.ReqDiffAlignmentService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeInsightAiReviewServiceImpl implements CodeInsightAiReviewService {

    private final TaskRepository taskRepository;
    private final ProjectCodeInsightSettingsRepository settingsRepository;
    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final GitHubPullRequestFileRepository pullRequestFileRepository;
    private final CodeInsightPatchService patchService;
    private final CodeInsightScoringService scoringService;
    private final CodeInsightAiReviewInputBuilder inputBuilder;
    private final CodeInsightAiProvider aiProvider;
    private final CodeInsightAiReviewRepository aiReviewRepository;
    private final ObjectMapper objectMapper;
    private final RequirementRepository requirementRepository;
    private final CodePatchAnalyzerService patchAnalyzerService;
    private final ReqDiffAlignmentService alignmentService;

    @Override
    @Transactional
    public CodeInsightAiReviewResponse createReview(Long projectId, Long taskId, Long userId) {
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
        if (task.getProject() == null || !projectId.equals(task.getProject().getId())) {
            throw new CustomException("Task does not belong to this project", HttpStatus.BAD_REQUEST);
        }
        ProjectCodeInsightSettings settings = settingsRepository.findByProjectId(projectId)
                .orElse(ProjectCodeInsightSettings.builder().aiReviewEnabled(false).build());
        if (!settings.isAiReviewEnabled()) {
            throw new CustomException("AI Review is disabled for this project", HttpStatus.FORBIDDEN);
        }
        ensureChangedFilesLoaded(projectId, taskId, userId);

        TaskReviewDecisionResponse.ReviewEvidenceSummary score = scoringService.buildReviewEvidenceSummary(task);
        CodeInsightAiProviderResult result = aiProvider.review(inputBuilder.build(task, score));

        // --- Phase 4: Req-Diff Alignment & Risk Assessment ---
        List<Long> pullRequestIds = evidenceLinkRepository.findByTaskId(taskId).stream()
                .filter(link -> link.getEvidenceType() == CodeInsightEvidenceType.PULL_REQUEST)
                .map(CodeInsightEvidenceLink::getEvidenceId)
                .distinct()
                .toList();

        CodePatchAnalysisResult analysisResult = null;
        ReqDiffAlignmentResult alignmentResult = null;

        if (!pullRequestIds.isEmpty()) {
            List<GitHubPullRequestFile> files = pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(pullRequestIds);
            StringBuilder rawDiffBuilder = new StringBuilder();
            for (GitHubPullRequestFile file : files) {
                rawDiffBuilder.append("--- ").append(file.getFilePath()).append("\n");
                rawDiffBuilder.append("+++ ").append(file.getFilePath()).append("\n");
                if (file.getPatchSummary() != null) {
                    rawDiffBuilder.append(file.getPatchSummary()).append("\n");
                }
            }
            String rawDiff = rawDiffBuilder.toString();
            try {
                analysisResult = patchAnalyzerService.analyzePatch(rawDiff);
            } catch (Exception ex) {
                log.error("Failed to analyze patch for task " + taskId, ex);
            }
        }

        List<String> acceptanceCriteria = List.of();
        if (task.getRequirementId() != null) {
            Requirement requirement = requirementRepository.findById(task.getRequirementId()).orElse(null);
            if (requirement != null && requirement.getAcceptanceCriteria() != null) {
                try {
                    acceptanceCriteria = objectMapper.readValue(requirement.getAcceptanceCriteria(), new TypeReference<List<String>>() {});
                } catch (Exception ex) {
                    log.error("Failed to parse acceptance criteria for requirement " + task.getRequirementId(), ex);
                }
            }
        }

        if (analysisResult != null && !acceptanceCriteria.isEmpty()) {
            try {
                alignmentResult = alignmentService.align(analysisResult, acceptanceCriteria);
            } catch (Exception ex) {
                log.error("Failed to align requirement-diff for task " + taskId, ex);
            }
        }

        String alignmentResultJson = null;
        Double alignmentCoverageRatio = null;
        Integer alignmentCoveredCount = null;
        Integer alignmentTotalCount = null;
        String codeRiskLevel = null;

        if (alignmentResult != null) {
            try {
                alignmentResultJson = objectMapper.writeValueAsString(alignmentResult);
                alignmentCoverageRatio = alignmentResult.getCoverageRatio();
                alignmentCoveredCount = alignmentResult.getCoveredCount();
                alignmentTotalCount = alignmentResult.getTotalCount();
                codeRiskLevel = alignmentResult.getFinalRiskLevel();
            } catch (Exception ex) {
                log.error("Failed to serialize alignment result for task " + taskId, ex);
            }
        }

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
                .alignmentResultJson(alignmentResultJson)
                .alignmentCoverageRatio(alignmentCoverageRatio)
                .alignmentCoveredCount(alignmentCoveredCount)
                .alignmentTotalCount(alignmentTotalCount)
                .codeRiskLevel(codeRiskLevel)
                .build());
        return toResponse(saved);
    }

    private void ensureChangedFilesLoaded(Long projectId, Long taskId, Long userId) {
        List<Long> pullRequestIds = evidenceLinkRepository.findByTaskId(taskId).stream()
                .filter(link -> link.getEvidenceType() == CodeInsightEvidenceType.PULL_REQUEST)
                .map(CodeInsightEvidenceLink::getEvidenceId)
                .distinct()
                .toList();
        if (pullRequestIds.isEmpty()) return;
        if (!pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(pullRequestIds).isEmpty()) {
            return;
        }
        patchService.fetchChangedFiles(projectId, taskId, userId);
        if (pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(pullRequestIds).isEmpty()) {
            throw new CustomException("Changed files could not be loaded from GitHub. Please retry before running AI Review.", HttpStatus.BAD_REQUEST);
        }
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
                .alignmentResultJson(review.getAlignmentResultJson())
                .alignmentCoverageRatio(review.getAlignmentCoverageRatio())
                .alignmentCoveredCount(review.getAlignmentCoveredCount())
                .alignmentTotalCount(review.getAlignmentTotalCount())
                .codeRiskLevel(review.getCodeRiskLevel())
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
