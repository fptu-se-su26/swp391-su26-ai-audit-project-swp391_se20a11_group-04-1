package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightApprovalGateResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.CodeInsightAiReviewRepository;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.CodeInsightReviewRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.CodeInsightApprovalGateService;
import org.example.backend.service.CodeInsightReviewSnapshotService;
import org.example.backend.service.CodeInsightScoringService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CodeInsightReviewSnapshotServiceImpl implements CodeInsightReviewSnapshotService {

    private final UserAccountRepository userAccountRepository;
    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final CodeInsightAiReviewRepository aiReviewRepository;
    private final CodeInsightReviewRepository reviewRepository;
    private final CodeInsightScoringService scoringService;
    private final ObjectMapper objectMapper;
    private final CodeInsightApprovalGateService approvalGateService;

    @Override
    @Transactional
    public Long createSnapshot(Task task, Long reviewerId) {
        UserAccount reviewer = userAccountRepository.findById(reviewerId)
                .orElseThrow(() -> new CustomException("Reviewer not found", HttpStatus.NOT_FOUND));
        TaskReviewDecisionResponse.ReviewEvidenceSummary score = scoringService.buildReviewEvidenceSummary(task);
        CodeInsightAiReview aiReview = aiReviewRepository.findTopByTaskIdOrderByCreatedAtDesc(task.getId()).orElse(null);
        int aiAdjustment = aiReview != null ? aiReview.getScoreAdjustment() : 0;
        int finalScore = Math.max(0, Math.min(100, score.getScore() + aiAdjustment));
        String snapshotJson = writeSnapshot(task, score, aiReview);

        CodeInsightApprovalGateResponse gate = approvalGateService.evaluate(task);

        CodeInsightReview saved = reviewRepository.save(CodeInsightReview.builder()
                .task(task)
                .reviewer(reviewer)
                .ruleScore(score.getScore())
                .aiAdjustment(aiAdjustment)
                .finalScore(finalScore)
                .riskLevel(score.getRiskLevel())
                .scoreReasonsJson(writeJson(score.getScoreBreakdown()))
                .evidenceSnapshotJson(snapshotJson)
                .evidenceHash(sha256(snapshotJson))
                .aiReview(aiReview)
                .gateResult(gate.getApprovalStatus())
                .evidenceConfidence(gate.getEvidenceConfidence())
                .codeRiskLevel(gate.getCodeRiskLevel())
                .createdAt(LocalDateTime.now())
                .build());
        return saved.getId();
    }

    private String writeSnapshot(Task task, TaskReviewDecisionResponse.ReviewEvidenceSummary score, CodeInsightAiReview aiReview) {
        List<Map<String, Object>> evidence = evidenceLinkRepository.findByTaskId(task.getId()).stream()
                .map(link -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("type", link.getEvidenceType() != null ? link.getEvidenceType().name() : null);
                    row.put("id", link.getEvidenceId());
                    row.put("source", link.getSource() != null ? link.getSource().name() : null);
                    row.put("confidence", link.getConfidence() != null ? link.getConfidence().name() : null);
                    return row;
                })
                .toList();
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("taskId", task.getId());
        snapshot.put("taskStatus", task.getStatus() != null ? task.getStatus().name() : null);
        snapshot.put("ruleScore", score.getScore());
        snapshot.put("riskLevel", score.getRiskLevel());
        snapshot.put("evidence", evidence);
        snapshot.put("aiReviewId", aiReview != null ? aiReview.getId() : null);
        snapshot.put("aiRecommendation", aiReview != null ? aiReview.getRecommendation() : null);
        snapshot.put("aiConfidence", aiReview != null ? aiReview.getConfidence() / 100.0 : null);
        snapshot.put("aiScoreAdjustment", aiReview != null ? aiReview.getScoreAdjustment() : null);
        snapshot.put("aiRiskCount", aiReview != null ? countJsonArray(aiReview.getRiskDetailsJson()) : 0);
        snapshot.put("aiQuestionCount", aiReview != null ? countJsonArray(aiReview.getQuestionsForLeaderJson()) : 0);
        return writeJson(snapshot);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            return "{}";
        }
    }

    private int countJsonArray(String json) {
        try {
            return json != null ? objectMapper.readTree(json).size() : 0;
        } catch (Exception ex) {
            return 0;
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
