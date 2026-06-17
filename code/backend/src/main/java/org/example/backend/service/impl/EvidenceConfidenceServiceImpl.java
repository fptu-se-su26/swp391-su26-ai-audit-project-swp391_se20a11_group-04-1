package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.EvidenceLinkRepository;
import org.example.backend.service.CodeInsightScoringService;
import org.example.backend.service.EvidenceConfidenceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EvidenceConfidenceServiceImpl implements EvidenceConfidenceService {

    private final CodeInsightScoringService scoringService;
    private final EvidenceLinkRepository evidenceLinkRepository;

    @Override
    @Transactional(readOnly = true)
    public EvidenceConfidenceLevel calculate(Task task) {
        if (task == null) {
            return EvidenceConfidenceLevel.NONE;
        }
        if (isCodeTask(task)) {
            return calculateForCodeTask(task);
        } else {
            return calculateForNonCodeTask(task);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public EvidenceConfidenceLevel calculateForCodeTask(Task task) {
        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = scoringService.buildReviewEvidenceSummary(task);

        boolean hasPr = summary.getPullRequestCount() > 0;
        boolean hasCommit = summary.getCommitCount() > 0;
        boolean hasCiPass = "PASSED".equals(summary.getCiStatus());
        boolean hasReq = task.getRequirementId() != null;
        boolean hasIssue = task.getGithubIssueNumber() != null || hasText(task.getGithubIssueUrl());

        boolean hasAnyEvidence = hasPr || hasCommit || summary.getCheckRunCount() > 0 || hasIssue;

        if (hasPr && hasCommit && hasCiPass && hasReq) {
            return EvidenceConfidenceLevel.STRONG;
        } else if ((hasPr || hasCommit) && (!hasCiPass || !hasReq)) {
            return EvidenceConfidenceLevel.PARTIAL;
        } else if (hasIssue || hasAnyEvidence) {
            return EvidenceConfidenceLevel.WEAK;
        } else {
            return EvidenceConfidenceLevel.NONE;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public EvidenceConfidenceLevel calculateForNonCodeTask(Task task) {
        if (task.getId() == null) {
            return EvidenceConfidenceLevel.NONE;
        }

        List<EvidenceLink> links = evidenceLinkRepository.findByEntityTypeAndEntityId(
                EvidenceEntityType.TASK,
                task.getId()
        );

        int manualEvidenceCount = links.size();
        long confirmedEvidenceCount = links.stream()
                .filter(link -> link.getEvidence() != null && link.getEvidence().getStatus() == EvidenceStatus.ACCEPTED)
                .count();

        boolean hasReqOrIssue = task.getRequirementId() != null
                || task.getGithubIssueNumber() != null
                || hasText(task.getGithubIssueUrl());

        if (confirmedEvidenceCount >= 1 && hasReqOrIssue) {
            return EvidenceConfidenceLevel.STRONG;
        } else if ((manualEvidenceCount > 0 && confirmedEvidenceCount == 0 && hasReqOrIssue)
                || (confirmedEvidenceCount >= 1 && !hasReqOrIssue)) {
            return EvidenceConfidenceLevel.PARTIAL;
        } else if (manualEvidenceCount > 0 && confirmedEvidenceCount == 0 && !hasReqOrIssue) {
            return EvidenceConfidenceLevel.WEAK;
        } else {
            return EvidenceConfidenceLevel.NONE;
        }
    }

    private boolean isCodeTask(Task task) {
        TaskType type = task.getType();
        return type == TaskType.DEVELOPMENT || type == TaskType.BUG_FIX;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
