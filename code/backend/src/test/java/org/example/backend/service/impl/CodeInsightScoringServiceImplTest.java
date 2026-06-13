package org.example.backend.service.impl;

import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CodeInsightScoringServiceImpl")
class CodeInsightScoringServiceImplTest {

    @Mock private TaskRepository taskRepository;
    @Mock private ProjectCodeInsightSettingsRepository codeInsightSettingsRepository;
    @Mock private CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    @Mock private CodeInsightManualEvidenceLinkRepository manualEvidenceLinkRepository;
    @Mock private GitHubCommitRepository commitRepository;
    @Mock private GitHubPullRequestRepository pullRequestRepository;
    @Mock private GitHubCheckRunRepository checkRunRepository;

    @InjectMocks
    private CodeInsightScoringServiceImpl scoringService;

    @Test
    void taskWithoutCodeEvidenceGetsWarningsAndLowerScore() {
        Task task = task();
        when(taskRepository.findByParentId(12L)).thenReturn(List.of());
        when(evidenceLinkRepository.findByTaskId(12L)).thenReturn(List.of());
        when(codeInsightSettingsRepository.findByProjectId(10L))
                .thenReturn(Optional.of(ProjectCodeInsightSettings.builder().minScoreWarningThreshold(70).build()));

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = scoringService.buildReviewEvidenceSummary(task);

        assertThat(summary.getCommitCount()).isZero();
        assertThat(summary.getPullRequestCount()).isZero();
        assertThat(summary.getCheckRunCount()).isZero();
        assertThat(summary.getCiStatus()).isEqualTo("NO_CI");
        assertThat(summary.getEvidenceMode()).isEqualTo("MANUAL_GATE");
        assertThat(summary.getWarnings()).contains("No linked commit evidence", "No linked pull request evidence");
        assertThat(summary.getScore()).isLessThan(70);
    }

    @Test
    void commitPullRequestAndPassingCiProduceReadyGithubCodeSummary() {
        Task task = task();
        task.setGithubIssueNumber(34);
        List<CodeInsightEvidenceLink> links = List.of(
                link(task, CodeInsightEvidenceType.COMMIT, 101L),
                link(task, CodeInsightEvidenceType.PULL_REQUEST, 201L),
                link(task, CodeInsightEvidenceType.CHECK_RUN, 301L));

        when(taskRepository.findByParentId(12L)).thenReturn(List.of());
        when(evidenceLinkRepository.findByTaskId(12L)).thenReturn(links);
        when(commitRepository.findAllById(List.of(101L))).thenReturn(List.of(GitHubCommit.builder()
                .id(101L)
                .authorEmail("hieu@example.com")
                .build()));
        when(pullRequestRepository.findAllById(List.of(201L))).thenReturn(List.of(GitHubPullRequest.builder()
                .id(201L)
                .mergedAt(LocalDateTime.now())
                .authorLogin("hieu")
                .build()));
        when(checkRunRepository.findAllById(List.of(301L))).thenReturn(List.of(GitHubCheckRun.builder()
                .id(301L)
                .conclusion("success")
                .build()));
        when(codeInsightSettingsRepository.findByProjectId(10L))
                .thenReturn(Optional.of(ProjectCodeInsightSettings.builder().minScoreWarningThreshold(70).build()));

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = scoringService.buildReviewEvidenceSummary(task);

        assertThat(summary.getEvidenceMode()).isEqualTo("GITHUB_CODE_LINKED");
        assertThat(summary.getCommitCount()).isEqualTo(1);
        assertThat(summary.getPullRequestCount()).isEqualTo(1);
        assertThat(summary.getCheckRunCount()).isEqualTo(1);
        assertThat(summary.getCiStatus()).isEqualTo("PASSED");
        assertThat(summary.isHasMergedPullRequest()).isTrue();
        assertThat(summary.getPositiveSignals()).contains(
                "Linked commit evidence found",
                "Linked pull request evidence found",
                "Linked CI/check passed",
                "GitHub author matches assignee");
        assertThat(summary.getRiskLevel()).isEqualTo("READY");
    }

    @Test
    void failedCiDraftPrAndAuthorMismatchReduceScore() {
        Task task = task();
        task.setGithubIssueNumber(34);
        List<CodeInsightEvidenceLink> links = List.of(
                link(task, CodeInsightEvidenceType.PULL_REQUEST, 201L),
                link(task, CodeInsightEvidenceType.CHECK_RUN, 301L));

        when(taskRepository.findByParentId(12L)).thenReturn(List.of());
        when(evidenceLinkRepository.findByTaskId(12L)).thenReturn(links);
        when(pullRequestRepository.findAllById(List.of(201L))).thenReturn(List.of(GitHubPullRequest.builder()
                .id(201L)
                .draft(true)
                .authorLogin("another-user")
                .build()));
        when(checkRunRepository.findAllById(List.of(301L))).thenReturn(List.of(GitHubCheckRun.builder()
                .id(301L)
                .conclusion("failure")
                .build()));
        when(codeInsightSettingsRepository.findByProjectId(10L))
                .thenReturn(Optional.of(ProjectCodeInsightSettings.builder().minScoreWarningThreshold(70).build()));

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = scoringService.buildReviewEvidenceSummary(task);

        assertThat(summary.getWarnings()).contains(
                "No linked commit evidence",
                "Linked pull request is still draft",
                "Linked CI/check failed",
                "GitHub author does not match assignee");
        assertThat(summary.getScore()).isLessThan(50);
        assertThat(summary.getRiskLevel()).isEqualTo("BLOCKED");
    }

    @Test
    void failedCiBlocksReadyRiskEvenWhenScoreIsAboveThreshold() {
        Task task = task();
        task.setGithubIssueNumber(34);
        List<CodeInsightEvidenceLink> links = List.of(
                link(task, CodeInsightEvidenceType.COMMIT, 101L),
                link(task, CodeInsightEvidenceType.PULL_REQUEST, 201L),
                link(task, CodeInsightEvidenceType.CHECK_RUN, 301L));

        when(taskRepository.findByParentId(12L)).thenReturn(List.of());
        when(evidenceLinkRepository.findByTaskId(12L)).thenReturn(links);
        when(commitRepository.findAllById(List.of(101L))).thenReturn(List.of(GitHubCommit.builder()
                .id(101L)
                .authorEmail("hieu@example.com")
                .build()));
        when(pullRequestRepository.findAllById(List.of(201L))).thenReturn(List.of(GitHubPullRequest.builder()
                .id(201L)
                .mergedAt(LocalDateTime.now())
                .authorLogin("hieu")
                .build()));
        when(checkRunRepository.findAllById(List.of(301L))).thenReturn(List.of(GitHubCheckRun.builder()
                .id(301L)
                .conclusion("failure")
                .build()));
        when(codeInsightSettingsRepository.findByProjectId(10L))
                .thenReturn(Optional.of(ProjectCodeInsightSettings.builder().minScoreWarningThreshold(70).build()));

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = scoringService.buildReviewEvidenceSummary(task);

        assertThat(summary.getScore()).isGreaterThanOrEqualTo(70);
        assertThat(summary.getWarnings()).contains("Linked CI/check failed");
        assertThat(summary.getRiskLevel()).isEqualTo("BLOCKED");
    }

    @Test
    void newerPullRequestHeadPassingCiOverridesOlderFailedCheck() {
        Task task = task();
        task.setGithubIssueNumber(34);
        List<CodeInsightEvidenceLink> links = List.of(
                link(task, CodeInsightEvidenceType.COMMIT, 101L),
                link(task, CodeInsightEvidenceType.COMMIT, 102L),
                link(task, CodeInsightEvidenceType.PULL_REQUEST, 201L),
                link(task, CodeInsightEvidenceType.CHECK_RUN, 301L),
                link(task, CodeInsightEvidenceType.CHECK_RUN, 302L));

        when(taskRepository.findByParentId(12L)).thenReturn(List.of());
        when(evidenceLinkRepository.findByTaskId(12L)).thenReturn(links);
        when(commitRepository.findAllById(List.of(101L, 102L))).thenReturn(List.of(
                GitHubCommit.builder()
                        .id(101L)
                        .sha("oldsha")
                        .authorEmail("hieu@example.com")
                        .build(),
                GitHubCommit.builder()
                        .id(102L)
                        .sha("newsha")
                        .authorEmail("hieu@example.com")
                        .build()));
        when(pullRequestRepository.findAllById(List.of(201L))).thenReturn(List.of(GitHubPullRequest.builder()
                .id(201L)
                .headSha("newsha")
                .authorLogin("hieu")
                .build()));
        when(checkRunRepository.findAllById(List.of(301L, 302L))).thenReturn(List.of(
                GitHubCheckRun.builder()
                        .id(301L)
                        .sha("oldsha")
                        .conclusion("failure")
                        .build(),
                GitHubCheckRun.builder()
                        .id(302L)
                        .sha("newsha")
                        .conclusion("success")
                        .build()));
        when(codeInsightSettingsRepository.findByProjectId(10L))
                .thenReturn(Optional.of(ProjectCodeInsightSettings.builder().minScoreWarningThreshold(70).build()));

        TaskReviewDecisionResponse.ReviewEvidenceSummary summary = scoringService.buildReviewEvidenceSummary(task);

        assertThat(summary.getCiStatus()).isEqualTo("PASSED");
        assertThat(summary.getWarnings()).doesNotContain("Linked CI/check failed");
        assertThat(summary.getRiskLevel()).isEqualTo("READY");
    }

    private Task task() {
        UserAccount assignee = UserAccount.builder()
                .id(5L)
                .username("hieu")
                .email("hieu@example.com")
                .build();
        return Task.builder()
                .id(12L)
                .project(Project.builder().id(10L).build())
                .requirementId(1L)
                .primaryAssignee(assignee)
                .status(TaskStatus.IN_REVIEW)
                .checklist(List.of())
                .build();
    }

    private CodeInsightEvidenceLink link(Task task, CodeInsightEvidenceType type, Long evidenceId) {
        return CodeInsightEvidenceLink.builder()
                .project(task.getProject())
                .task(task)
                .evidenceType(type)
                .evidenceId(evidenceId)
                .build();
    }
}
