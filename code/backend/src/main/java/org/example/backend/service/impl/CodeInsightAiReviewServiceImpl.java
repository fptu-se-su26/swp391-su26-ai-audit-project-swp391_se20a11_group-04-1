package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.CodeInsightAiReview;
import org.example.backend.entity.CodeInsightEvidenceType;
import org.example.backend.entity.GitHubPullRequestFile;
import org.example.backend.entity.Task;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.CodeInsightAiReviewRepository;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.GitHubPullRequestFileRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.CodeInsightAiReviewService;
import org.example.backend.service.CodeInsightScoringService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CodeInsightAiReviewServiceImpl implements CodeInsightAiReviewService {

    private final TaskRepository taskRepository;
    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final GitHubPullRequestFileRepository pullRequestFileRepository;
    private final CodeInsightScoringService scoringService;
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
        List<Long> prIds = evidenceLinkRepository.findByTaskId(taskId).stream()
                .filter(link -> link.getEvidenceType() == CodeInsightEvidenceType.PULL_REQUEST)
                .map(link -> link.getEvidenceId())
                .distinct()
                .toList();
        List<GitHubPullRequestFile> files = prIds.isEmpty()
                ? List.of()
                : pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(prIds);

        List<String> risks = new ArrayList<>(score.getWarnings() != null ? score.getWarnings() : List.of());
        if (files.isEmpty()) {
            risks.add("Changed files have not been loaded yet.");
        }

        List<String> questions = new ArrayList<>();
        if (score.getPullRequestCount() == 0) questions.add("Which pull request contains the implementation?");
        if (score.getCheckRunCount() == 0) questions.add("Has CI or a manual verification run been completed?");
        if (files.isEmpty()) questions.add("Do the changed files match the task scope?");
        if (questions.isEmpty()) questions.add("Does the implementation satisfy the acceptance criteria?");

        String recommendation = score.getRiskLevel() != null && score.getRiskLevel().equals("BLOCKED")
                ? "NEEDS_CHANGES"
                : score.getScore() >= 85 && !files.isEmpty() ? "LIKELY_READY" : "REVIEW_CAREFULLY";
        int adjustment = clampAdjustment(recommendation.equals("LIKELY_READY") ? 5 : recommendation.equals("NEEDS_CHANGES") ? -10 : 0);
        int confidence = Math.max(30, Math.min(90, score.getScore() + (files.isEmpty() ? -10 : 5)));

        CodeInsightAiReview saved = aiReviewRepository.save(CodeInsightAiReview.builder()
                .task(task)
                .provider("LOCAL_RULE_ASSISTANT")
                .recommendation(recommendation)
                .confidence(confidence)
                .summary(buildSummary(task, score, files))
                .risksJson(writeList(risks))
                .reviewQuestionsJson(writeList(questions))
                .scoreAdjustment(adjustment)
                .build());
        return toResponse(saved);
    }

    public CodeInsightAiReviewResponse toResponse(CodeInsightAiReview review) {
        if (review == null) return null;
        return CodeInsightAiReviewResponse.builder()
                .id(review.getId())
                .provider(review.getProvider())
                .recommendation(review.getRecommendation())
                .confidence(review.getConfidence())
                .summary(review.getSummary())
                .risks(readList(review.getRisksJson()))
                .reviewQuestions(readList(review.getReviewQuestionsJson()))
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

    private String buildSummary(Task task, TaskReviewDecisionResponse.ReviewEvidenceSummary score, List<GitHubPullRequestFile> files) {
        return "Task \"" + task.getTitle() + "\" has score " + score.getScore() + "/100 with "
                + score.getCommitCount() + " commit(s), " + score.getPullRequestCount() + " PR(s), "
                + score.getCheckRunCount() + " CI/check record(s), and " + files.size()
                + " changed file(s) loaded.";
    }

    private int clampAdjustment(int value) {
        return Math.max(-15, Math.min(15, value));
    }

    private String writeList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception ex) {
            return "[]";
        }
    }

    private List<String> readList(String json) {
        try {
            return json != null ? objectMapper.readValue(json, new TypeReference<List<String>>() {}) : List.of();
        } catch (Exception ex) {
            return List.of();
        }
    }
}
