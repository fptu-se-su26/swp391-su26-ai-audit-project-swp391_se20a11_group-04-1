package org.example.backend.service.github.impl;

import org.example.backend.entity.BugReport;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.Project;
import org.example.backend.entity.Task;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.example.backend.service.github.core.GitHubOAuthService;
import org.example.backend.service.github.core.GitHubWebhookDeliveryService;
import org.example.backend.service.github.core.GitHubWebhookService;
import org.example.backend.service.github.issue.GitHubIssueSyncService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GitHubApiServiceImpl facade")
class GitHubApiServiceImplTest {

    @Mock private GitHubIssueSyncService issueSyncService;
    @Mock private GitHubWebhookService webhookService;
    @Mock private GitHubIntegrationService integrationService;
    @Mock private GitHubWebhookDeliveryService webhookDeliveryService;
    @Mock private GitHubOAuthService oauthService;

    @InjectMocks
    private GitHubApiServiceImpl gitHubApiService;

    @Test
    void issueMethodsDelegateToIssueSyncService() {
        BugReport bugReport = BugReport.builder().id(10L).build();
        Task task = Task.builder().id(20L).build();

        gitHubApiService.createGitHubIssue(bugReport, 1L);
        gitHubApiService.createGitHubIssueForTask(task, 1L);
        gitHubApiService.updateGitHubIssueStatus(bugReport, 1L);
        gitHubApiService.updateGitHubIssueStatusForTask(task, 1L);

        verify(issueSyncService).createGitHubIssue(bugReport, 1L);
        verify(issueSyncService).createGitHubIssueForTask(task, 1L);
        verify(issueSyncService).updateGitHubIssueStatus(bugReport, 1L);
        verify(issueSyncService).updateGitHubIssueStatusForTask(task, 1L);
    }

    @Test
    void webhookMethodsDelegateToWebhookServices() {
        byte[] payload = "{}".getBytes();

        gitHubApiService.handleWebhook("sha256=test", "delivery-1", "issues", payload);
        gitHubApiService.pingWebhook(100L, 1L);
        gitHubApiService.autoConfigureWebhook(100L, 1L, "https://example.com/api/v1/github/webhook", List.of("issues"), "secret");
        gitHubApiService.redeliverWebhook(100L, 55L, 1L);

        verify(webhookService).handleWebhook("sha256=test", "delivery-1", "issues", payload);
        verify(webhookDeliveryService).pingWebhook(100L, 1L);
        verify(webhookDeliveryService).autoConfigureWebhook(100L, 1L, "https://example.com/api/v1/github/webhook", List.of("issues"), "secret");
        verify(webhookDeliveryService).redeliverWebhook(100L, 55L, 1L);
    }

    @Test
    void integrationMethodsDelegateToIntegrationService() {
        GitHubIntegration integration = GitHubIntegration.builder()
                .id(1L)
                .project(Project.builder().id(100L).build())
                .repoOwner("owner")
                .repoName("repo")
                .build();
        Map<String, Object> request = Map.of("repoOwner", "owner", "repoName", "repo");
        when(integrationService.getIntegration(100L, 1L)).thenReturn(integration);
        when(integrationService.saveIntegration(100L, request, 1L)).thenReturn(integration);
        when(integrationService.hasUserToken(1L)).thenReturn(true);
        when(integrationService.encryptToken("secret")).thenReturn("encrypted");
        when(integrationService.decryptToken("encrypted")).thenReturn("secret");

        assertThat(gitHubApiService.getIntegration(100L, 1L)).isSameAs(integration);
        assertThat(gitHubApiService.saveIntegration(100L, request, 1L)).isSameAs(integration);
        assertThat(gitHubApiService.hasUserToken(1L)).isTrue();
        assertThat(gitHubApiService.encryptToken("secret")).isEqualTo("encrypted");
        assertThat(gitHubApiService.decryptToken("encrypted")).isEqualTo("secret");
    }

    @Test
    void oauthAndDeliveryQueriesDelegateToCoreServices() {
        when(oauthService.getOAuthUrl()).thenReturn("https://github.com/login/oauth/authorize");
        when(oauthService.exchangeCodeForToken("code", 1L)).thenReturn("Success");
        when(oauthService.getUserRepositories(1L)).thenReturn(List.of(Map.of("name", "repo")));
        when(oauthService.createRepository(1L, "repo", "desc", true, false, null, null)).thenReturn(Map.of("name", "repo"));
        when(webhookDeliveryService.getRateLimit(100L, 1L)).thenReturn(Map.of("remaining", 4999));
        when(webhookDeliveryService.getWebhookDeliveryStatus(100L, 1L)).thenReturn(Map.of("webhookStatus", "HEALTHY"));
        when(webhookDeliveryService.getWebhookDeliveries(100L, 1L)).thenReturn(List.of(Map.of("id", "1")));

        assertThat(gitHubApiService.getOAuthUrl()).contains("github.com");
        assertThat(gitHubApiService.exchangeCodeForToken("code", 1L)).isEqualTo("Success");
        assertThat(gitHubApiService.getUserRepositories(1L)).isInstanceOf(List.class);
        assertThat(gitHubApiService.createRepository(1L, "repo", "desc", true, false, null, null)).isInstanceOf(Map.class);
        assertThat(gitHubApiService.getRateLimit(100L, 1L)).containsEntry("remaining", 4999);
        assertThat(gitHubApiService.getWebhookDeliveryStatus(100L, 1L)).containsEntry("webhookStatus", "HEALTHY");
        assertThat(gitHubApiService.getWebhookDeliveries(100L, 1L)).isInstanceOf(List.class);
    }
}
