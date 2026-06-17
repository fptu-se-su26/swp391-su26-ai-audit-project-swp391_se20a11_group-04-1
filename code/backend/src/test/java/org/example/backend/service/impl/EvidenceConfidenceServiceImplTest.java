package org.example.backend.service.impl;

import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.EvidenceLinkRepository;
import org.example.backend.service.CodeInsightScoringService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("EvidenceConfidenceServiceImpl")
class EvidenceConfidenceServiceImplTest {

    @Mock
    private CodeInsightScoringService scoringService;

    @Mock
    private EvidenceLinkRepository evidenceLinkRepository;

    @InjectMocks
    private EvidenceConfidenceServiceImpl confidenceService;

    @Test
    void calculateForCodeTask_Strong() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DEVELOPMENT)
                .requirementId(100L)
                .build();

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .pullRequestCount(1)
                .commitCount(5)
                .ciStatus("PASSED")
                .checkRunCount(2)
                .build();

        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(summary);

        EvidenceConfidenceLevel level = confidenceService.calculate(task);
        assertThat(level).isEqualTo(EvidenceConfidenceLevel.STRONG);
    }

    @Test
    void calculateForCodeTask_Partial() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DEVELOPMENT)
                .requirementId(null) // Missing requirement
                .build();

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .pullRequestCount(1)
                .commitCount(5)
                .ciStatus("PASSED")
                .checkRunCount(2)
                .build();

        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(summary);

        EvidenceConfidenceLevel level = confidenceService.calculate(task);
        assertThat(level).isEqualTo(EvidenceConfidenceLevel.PARTIAL);
    }

    @Test
    void calculateForCodeTask_Weak() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DEVELOPMENT)
                .githubIssueNumber(42) // Only issue linked
                .build();

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .pullRequestCount(0)
                .commitCount(0)
                .ciStatus("NO_CI")
                .checkRunCount(0)
                .build();

        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(summary);

        EvidenceConfidenceLevel level = confidenceService.calculate(task);
        assertThat(level).isEqualTo(EvidenceConfidenceLevel.WEAK);
    }

    @Test
    void calculateForCodeTask_None() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DEVELOPMENT)
                .build();

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .pullRequestCount(0)
                .commitCount(0)
                .ciStatus("NO_CI")
                .checkRunCount(0)
                .build();

        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(summary);

        EvidenceConfidenceLevel level = confidenceService.calculate(task);
        assertThat(level).isEqualTo(EvidenceConfidenceLevel.NONE);
    }

    @Test
    void calculateForNonCodeTask_Strong() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DOCUMENTATION)
                .requirementId(100L)
                .build();

        Evidence evidence = new Evidence();
        evidence.setStatus(EvidenceStatus.ACCEPTED);

        EvidenceLink link = new EvidenceLink();
        link.setEvidence(evidence);

        when(evidenceLinkRepository.findByEntityTypeAndEntityId(EvidenceEntityType.TASK, 1L))
                .thenReturn(List.of(link));

        EvidenceConfidenceLevel level = confidenceService.calculate(task);
        assertThat(level).isEqualTo(EvidenceConfidenceLevel.STRONG);
    }

    @Test
    void calculateForNonCodeTask_Partial() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DOCUMENTATION)
                .requirementId(100L)
                .build();

        Evidence evidence = new Evidence();
        evidence.setStatus(EvidenceStatus.PENDING); // Not yet confirmed

        EvidenceLink link = new EvidenceLink();
        link.setEvidence(evidence);

        when(evidenceLinkRepository.findByEntityTypeAndEntityId(EvidenceEntityType.TASK, 1L))
                .thenReturn(List.of(link));

        EvidenceConfidenceLevel level = confidenceService.calculate(task);
        assertThat(level).isEqualTo(EvidenceConfidenceLevel.PARTIAL);
    }

    @Test
    void calculateForNonCodeTask_Weak() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DOCUMENTATION)
                .requirementId(null) // No requirement/issue linked
                .build();

        Evidence evidence = new Evidence();
        evidence.setStatus(EvidenceStatus.PENDING); // Not confirmed

        EvidenceLink link = new EvidenceLink();
        link.setEvidence(evidence);

        when(evidenceLinkRepository.findByEntityTypeAndEntityId(EvidenceEntityType.TASK, 1L))
                .thenReturn(List.of(link));

        EvidenceConfidenceLevel level = confidenceService.calculate(task);
        assertThat(level).isEqualTo(EvidenceConfidenceLevel.WEAK);
    }

    @Test
    void calculateForNonCodeTask_None() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DOCUMENTATION)
                .build();

        when(evidenceLinkRepository.findByEntityTypeAndEntityId(EvidenceEntityType.TASK, 1L))
                .thenReturn(List.of());

        EvidenceConfidenceLevel level = confidenceService.calculate(task);
        assertThat(level).isEqualTo(EvidenceConfidenceLevel.NONE);
    }
}
