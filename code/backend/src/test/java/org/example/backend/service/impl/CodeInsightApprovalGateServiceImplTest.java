package org.example.backend.service.impl;

import org.example.backend.dto.CodeInsightApprovalGateResponse;
import org.example.backend.dto.GateCheck;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
import org.example.backend.service.CodeInsightScoringService;
import org.example.backend.service.EvidenceConfidenceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CodeInsightApprovalGateServiceImpl")
class CodeInsightApprovalGateServiceImplTest {

    @Mock private CodeInsightScoringService scoringService;
    @Mock private ProjectCodeInsightSettingsRepository settingsRepository;
    @Mock private CodeInsightEvidenceLinkRepository codeInsightEvidenceLinkRepository;
    @Mock private CodeInsightManualEvidenceLinkRepository manualEvidenceLinkRepository;
    @Mock private CodeInsightAiReviewRepository aiReviewRepository;
    @Mock private EvidenceLinkRepository generalEvidenceLinkRepository;
    @Mock private EvidenceConfidenceService confidenceService;

    @InjectMocks
    private CodeInsightApprovalGateServiceImpl approvalGateService;

    @Test
    void evaluate_DevelopmentTask_CanApprove() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DEVELOPMENT)
                .project(Project.builder().id(10L).build())
                .build();

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .pullRequestCount(1)
                .commitCount(3)
                .ciStatus("PASSED")
                .hasMergedPullRequest(true)
                .positiveSignals(List.of("GitHub author matches assignee"))
                .warnings(Collections.emptyList())
                .build();

        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(summary);
        when(settingsRepository.findByProjectId(10L)).thenReturn(Optional.empty());
        when(aiReviewRepository.findTopByTaskIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.empty());
        when(confidenceService.calculate(task)).thenReturn(EvidenceConfidenceLevel.STRONG);

        CodeInsightApprovalGateResponse response = approvalGateService.evaluate(task);

        assertThat(response.getApprovalStatus()).isEqualTo("CAN_APPROVE");
        assertThat(response.getEvidenceConfidence()).isEqualTo("STRONG");
        assertThat(response.getCodeRiskLevel()).isEqualTo("LOW");
        assertThat(response.getBlockers()).isEmpty();
        assertThat(response.getWarnings()).isEmpty();

        // Verify checklist items
        List<String> checkNames = response.getGateChecks().stream().map(GateCheck::getName).toList();
        assertThat(checkNames).containsExactlyInAnyOrder(
                "PR_LINKED", "COMMIT_EXIST", "CI_PIPELINE_PASSED", "PR_MERGEABLE", "PEER_APPROVED", "AUTHOR_MATCH"
        );
    }

    @Test
    void evaluate_DevelopmentTask_Blocked_MissingPR() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DEVELOPMENT)
                .project(Project.builder().id(10L).build())
                .build();

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .pullRequestCount(0) // Missing PR
                .commitCount(3)
                .ciStatus("PASSED")
                .hasMergedPullRequest(false)
                .positiveSignals(List.of("GitHub author matches assignee"))
                .warnings(Collections.emptyList())
                .build();

        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(summary);
        when(settingsRepository.findByProjectId(10L)).thenReturn(Optional.empty());
        when(aiReviewRepository.findTopByTaskIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.empty());
        when(confidenceService.calculate(task)).thenReturn(EvidenceConfidenceLevel.PARTIAL);

        CodeInsightApprovalGateResponse response = approvalGateService.evaluate(task);

        assertThat(response.getApprovalStatus()).isEqualTo("BLOCKED");
        assertThat(response.getBlockers()).contains("A pull request is required before approval.");
    }

    @Test
    void evaluate_DevelopmentTask_Warning_DraftPR() {
        Task task = Task.builder()
                .id(1L)
                .type(TaskType.DEVELOPMENT)
                .project(Project.builder().id(10L).build())
                .build();

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .pullRequestCount(1)
                .commitCount(3)
                .ciStatus("PASSED")
                .hasMergedPullRequest(true)
                .positiveSignals(List.of("GitHub author matches assignee"))
                .warnings(List.of("Linked pull request is still draft"))
                .build();

        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(summary);
        when(settingsRepository.findByProjectId(10L)).thenReturn(Optional.empty());
        when(aiReviewRepository.findTopByTaskIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.empty());
        when(confidenceService.calculate(task)).thenReturn(EvidenceConfidenceLevel.STRONG);

        CodeInsightApprovalGateResponse response = approvalGateService.evaluate(task);

        assertThat(response.getApprovalStatus()).isEqualTo("CAN_APPROVE_WITH_WARNING");
        assertThat(response.getWarnings()).contains("Linked pull request is still draft.");
    }

    @Test
    void evaluate_DocumentationTask_CanApprove() {
        Task task = Task.builder()
                .id(2L)
                .type(TaskType.DOCUMENTATION)
                .project(Project.builder().id(10L).build())
                .build();

        Evidence docEvidence = new Evidence();
        docEvidence.setType(EvidenceType.DOCUMENT);
        docEvidence.setStatus(EvidenceStatus.ACCEPTED);

        EvidenceLink docLink = new EvidenceLink();
        docLink.setEvidence(docEvidence);

        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(
                TaskReviewDecisionResponse.ReviewEvidenceSummary.builder().build()
        );
        when(settingsRepository.findByProjectId(10L)).thenReturn(Optional.empty());
        when(aiReviewRepository.findTopByTaskIdOrderByCreatedAtDesc(2L)).thenReturn(Optional.empty());
        when(confidenceService.calculate(task)).thenReturn(EvidenceConfidenceLevel.STRONG);
        when(generalEvidenceLinkRepository.findByEntityTypeAndEntityId(EvidenceEntityType.TASK, 2L))
                .thenReturn(List.of(docLink));

        CodeInsightApprovalGateResponse response = approvalGateService.evaluate(task);

        assertThat(response.getApprovalStatus()).isEqualTo("CAN_APPROVE");
        assertThat(response.getBlockers()).isEmpty();
        assertThat(response.getWarnings()).isEmpty();

        List<String> checkNames = response.getGateChecks().stream().map(GateCheck::getName).toList();
        assertThat(checkNames).containsExactlyInAnyOrder("DOCS_LINK_PROVIDED", "DOCS_ACCESSIBILITY");
    }

    @Test
    void evaluate_DocumentationTask_Blocked_MissingDocs() {
        Task task = Task.builder()
                .id(2L)
                .type(TaskType.DOCUMENTATION)
                .project(Project.builder().id(10L).build())
                .build();

        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(
                TaskReviewDecisionResponse.ReviewEvidenceSummary.builder().build()
        );
        when(settingsRepository.findByProjectId(10L)).thenReturn(Optional.empty());
        when(aiReviewRepository.findTopByTaskIdOrderByCreatedAtDesc(2L)).thenReturn(Optional.empty());
        when(confidenceService.calculate(task)).thenReturn(EvidenceConfidenceLevel.NONE);
        when(generalEvidenceLinkRepository.findByEntityTypeAndEntityId(EvidenceEntityType.TASK, 2L))
                .thenReturn(Collections.emptyList());

        CodeInsightApprovalGateResponse response = approvalGateService.evaluate(task);

        assertThat(response.getApprovalStatus()).isEqualTo("BLOCKED");
        assertThat(response.getBlockers()).contains("Documentation link is required.");
    }
}
