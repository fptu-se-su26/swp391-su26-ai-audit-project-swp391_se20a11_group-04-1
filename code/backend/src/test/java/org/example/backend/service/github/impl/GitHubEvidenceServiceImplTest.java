package org.example.backend.service.github.impl;

import org.example.backend.entity.*;
import org.example.backend.repository.GitHubCheckRunRepository;
import org.example.backend.repository.GitHubCommitRepository;
import org.example.backend.repository.GitHubPullRequestRepository;
import org.example.backend.repository.GitHubWebhookEventRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GitHubEvidenceServiceImpl")
class GitHubEvidenceServiceImplTest {

    @Mock private GitHubWebhookEventRepository webhookEventRepository;
    @Mock private GitHubCommitRepository commitRepository;
    @Mock private GitHubPullRequestRepository pullRequestRepository;
    @Mock private GitHubCheckRunRepository checkRunRepository;

    @InjectMocks
    private GitHubEvidenceServiceImpl evidenceService;

    @Test
    void savePendingEventSkipsDuplicateDelivery() {
        when(webhookEventRepository.findByDeliveryId("delivery-1"))
                .thenReturn(Optional.of(GitHubWebhookEvent.builder().id(1L).build()));

        assertThat(evidenceService.savePendingEvent(integration(), "delivery-1", "push", "sig", "hash", Map.of())).isEmpty();

        verify(webhookEventRepository, never()).saveAndFlush(any());
    }

    @Test
    void upsertCommitCreatesOrUpdatesByIntegrationAndSha() {
        GitHubIntegration integration = integration();
        Map<String, Object> commit = Map.of(
                "id", "abc123",
                "message", "TSK-1 add login",
                "author", Map.of("name", "Hieu", "email", "hieu@example.com", "date", "2026-06-04T10:00:00Z"),
                "html_url", "https://github.com/owner/repo/commit/abc123");

        when(commitRepository.findByIntegrationIdAndSha(1L, "abc123")).thenReturn(Optional.empty());
        when(commitRepository.save(any(GitHubCommit.class))).thenAnswer(invocation -> invocation.getArgument(0));

        evidenceService.upsertCommit(integration, commit, "feature/TSK-1-login");

        verify(commitRepository).save(argThat(saved ->
                saved.getIntegration() == integration
                        && saved.getProject() == integration.getProject()
                        && saved.getSha().equals("abc123")
                        && saved.getBranchName().equals("feature/TSK-1-login")
                        && saved.getAuthorEmail().equals("hieu@example.com")));
    }

    @Test
    void upsertPullRequestUsesIntegrationAndPrNumber() {
        GitHubIntegration integration = integration();
        Map<String, Object> pullRequest = Map.of(
                "number", 12,
                "title", "TSK-12 implement feature",
                "state", "open",
                "draft", false,
                "user", Map.of("login", "hieu"),
                "head", Map.of("ref", "feature/task-12", "sha", "headsha"),
                "base", Map.of("ref", "develop"),
                "html_url", "https://github.com/owner/repo/pull/12");

        when(pullRequestRepository.findByIntegrationIdAndPrNumber(1L, 12)).thenReturn(Optional.empty());

        evidenceService.upsertPullRequest(integration, pullRequest);

        verify(pullRequestRepository).save(argThat(saved ->
                saved.getPrNumber().equals(12)
                        && saved.getHeadBranch().equals("feature/task-12")
                        && saved.getHeadSha().equals("headsha")
                        && saved.getAuthorLogin().equals("hieu")));
    }

    @Test
    void upsertCheckRunStoresCheckRunByExternalId() {
        GitHubIntegration integration = integration();
        Map<String, Object> checkRun = Map.of(
                "id", 99,
                "name", "build",
                "status", "completed",
                "conclusion", "success",
                "head_sha", "abc123",
                "html_url", "https://github.com/owner/repo/actions/runs/99");

        when(checkRunRepository.findByIntegrationIdAndEventTypeAndExternalId(1L, "check_run", "99")).thenReturn(Optional.empty());

        evidenceService.upsertCheckRun(integration, checkRun);

        verify(checkRunRepository).save(argThat(saved ->
                saved.getExternalId().equals("99")
                        && saved.getEventType().equals("check_run")
                        && saved.getSha().equals("abc123")
                        && saved.getConclusion().equals("success")));
    }

    private GitHubIntegration integration() {
        return GitHubIntegration.builder()
                .id(1L)
                .project(Project.builder().id(10L).build())
                .repoOwner("owner")
                .repoName("repo")
                .build();
    }
}
