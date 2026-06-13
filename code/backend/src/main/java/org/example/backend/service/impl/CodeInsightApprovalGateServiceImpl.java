package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightApprovalGateResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.CodeInsightEvidenceType;
import org.example.backend.entity.ProjectCodeInsightSettings;
import org.example.backend.entity.Task;
import org.example.backend.exception.BadRequestException;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.CodeInsightManualEvidenceLinkRepository;
import org.example.backend.repository.ProjectCodeInsightSettingsRepository;
import org.example.backend.service.CodeInsightApprovalGateService;
import org.example.backend.service.CodeInsightScoringService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CodeInsightApprovalGateServiceImpl implements CodeInsightApprovalGateService {

    private final CodeInsightScoringService scoringService;
    private final ProjectCodeInsightSettingsRepository settingsRepository;
    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final CodeInsightManualEvidenceLinkRepository manualEvidenceLinkRepository;

    @Override
    @Transactional(readOnly = true)
    public CodeInsightApprovalGateResponse evaluate(Task task) {
        TaskReviewDecisionResponse.ReviewEvidenceSummary score = scoringService.buildReviewEvidenceSummary(task);
        ProjectCodeInsightSettings settings = task.getProject() != null
                ? settingsRepository.findByProjectId(task.getProject().getId()).orElse(defaultSettings())
                : defaultSettings();

        List<String> blockers = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (score.getScore() < settings.getBlockScoreThreshold()) {
            blockers.add("Score is below the block threshold (" + settings.getBlockScoreThreshold() + ").");
        }
        if ("BLOCKED".equals(score.getRiskLevel())) {
            blockers.add("Rule-based review risk is BLOCKED.");
        }
        if (settings.isRequirePrForDone() && score.getPullRequestCount() == 0) {
            blockers.add("A pull request is required before approval.");
        }
        if ("FAILED".equals(score.getCiStatus())) {
            blockers.add("Linked CI/check evidence failed.");
        }

        if ("NO_CI".equals(score.getCiStatus())) {
            warnings.add("No CI/check evidence is linked. Approval will be recorded without CI verification.");
        } else if ("PENDING".equals(score.getCiStatus())) {
            warnings.add("Linked CI/check evidence is still pending.");
        }
        if (score.getScore() >= settings.getBlockScoreThreshold()
                && score.getScore() < settings.getMinScoreWarningThreshold()) {
            warnings.add("Score is below the warning threshold (" + settings.getMinScoreWarningThreshold() + ").");
        }
        if (hasPendingManualEvidence(task)) {
            warnings.add("Manual evidence is pending leader confirmation.");
        }
        if (settings.isRequireCiPass() && "NO_CI".equals(score.getCiStatus())) {
            warnings.add("CI pass is preferred, but no CI/check evidence exists for this task.");
        }

        String approvalStatus = !blockers.isEmpty()
                ? "BLOCKED"
                : !warnings.isEmpty() ? "CAN_APPROVE_WITH_WARNING" : "CAN_APPROVE";

        return CodeInsightApprovalGateResponse.builder()
                .approvalStatus(approvalStatus)
                .riskLevel(score.getRiskLevel())
                .score(score.getScore())
                .blockers(blockers)
                .warnings(warnings)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public void assertCanApprove(Task task) {
        CodeInsightApprovalGateResponse gate = evaluate(task);
        if ("BLOCKED".equals(gate.getApprovalStatus())) {
            throw new BadRequestException("Cannot approve task: " + String.join(" ", gate.getBlockers()));
        }
    }

    private boolean hasPendingManualEvidence(Task task) {
        return task != null && task.getId() != null
                && !manualEvidenceLinkRepository.findByTaskIdAndStatus(
                        task.getId(),
                        org.example.backend.entity.CodeInsightManualEvidenceLinkStatus.PENDING).isEmpty();
    }

    private ProjectCodeInsightSettings defaultSettings() {
        return ProjectCodeInsightSettings.builder()
                .reviewGateEnabled(true)
                .requirePrForDone(false)
                .requireCiPass(false)
                .aiReviewEnabled(false)
                .minScoreWarningThreshold(70)
                .blockScoreThreshold(50)
                .build();
    }
}
