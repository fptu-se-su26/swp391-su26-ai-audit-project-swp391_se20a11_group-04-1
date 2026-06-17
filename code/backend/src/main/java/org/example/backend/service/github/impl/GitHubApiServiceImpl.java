package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.BugReport;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.Task;
import org.example.backend.service.github.GitHubApiService;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.example.backend.service.github.core.GitHubOAuthService;
import org.example.backend.service.github.core.GitHubWebhookDeliveryService;
import org.example.backend.service.github.core.GitHubWebhookService;
import org.example.backend.service.github.issue.GitHubIssueSyncService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class GitHubApiServiceImpl implements GitHubApiService {

    private final GitHubIssueSyncService issueSyncService;
    private final GitHubWebhookService webhookService;
    private final GitHubIntegrationService integrationService;
    private final GitHubWebhookDeliveryService webhookDeliveryService;
    private final GitHubOAuthService oauthService;

    @Override
    public void createGitHubIssue(BugReport bugReport, Long userId) {
        issueSyncService.createGitHubIssue(bugReport, userId);
    }

    @Override
    public void createGitHubIssueForTask(Task task, Long userId) {
        issueSyncService.createGitHubIssueForTask(task, userId);
    }

    @Override
    public void updateGitHubIssueStatus(BugReport bugReport, Long userId) {
        issueSyncService.updateGitHubIssueStatus(bugReport, userId);
    }

    @Override
    public void updateGitHubIssueStatusForTask(Task task, Long userId) {
        issueSyncService.updateGitHubIssueStatusForTask(task, userId);
    }

    @Override
    public void handleWebhook(String signatureHeader, String deliveryId, String eventType, byte[] payloadBytes) {
        webhookService.handleWebhook(signatureHeader, deliveryId, eventType, payloadBytes);
    }

    @Override
    public String decryptToken(String encrypted) {
        return integrationService.decryptToken(encrypted);
    }

    @Override
    public GitHubIntegration getIntegration(Long projectId, Long userId) {
        return integrationService.getIntegration(projectId, userId);
    }

    @Override
    public boolean hasUserToken(Long userId) {
        return integrationService.hasUserToken(userId);
    }

    @Override
    public Map<String, Object> getRateLimit(Long projectId, Long userId) {
        return webhookDeliveryService.getRateLimit(projectId, userId);
    }

    @Override
    public Map<String, Object> getWebhookDeliveryStatus(Long projectId, Long userId) {
        return webhookDeliveryService.getWebhookDeliveryStatus(projectId, userId);
    }

    @Override
    public void pingWebhook(Long projectId, Long userId) {
        webhookDeliveryService.pingWebhook(projectId, userId);
    }

    @Override
    public GitHubIntegration saveIntegration(Long projectId, Map<String, Object> request, Long userId) {
        return integrationService.saveIntegration(projectId, request, userId);
    }

    @Override
    public String encryptToken(String plaintext) {
        return integrationService.encryptToken(plaintext);
    }

    @Override
    public Object getWebhookDeliveries(Long projectId, Long userId) {
        return webhookDeliveryService.getWebhookDeliveries(projectId, userId);
    }

    @Override
    public void redeliverWebhook(Long projectId, Long deliveryId, Long userId) {
        webhookDeliveryService.redeliverWebhook(projectId, deliveryId, userId);
    }

    @Override
    public String getOAuthUrl() {
        return oauthService.getOAuthUrl();
    }

    @Override
    public String exchangeCodeForToken(String code, Long userId) {
        return oauthService.exchangeCodeForToken(code, userId);
    }

    @Override
    public Object getUserRepositories(Long userId) {
        return oauthService.getUserRepositories(userId);
    }

    @Override
    public Object createRepository(Long userId, String name, String description, boolean isPrivate, boolean autoInit, String gitignoreTemplate, String licenseTemplate) {
        return oauthService.createRepository(userId, name, description, isPrivate, autoInit, gitignoreTemplate, licenseTemplate);
    }

    @Override
    public void autoConfigureWebhook(Long projectId, Long userId, String webhookUrl, List<String> events, String webhookSecret) {
        webhookDeliveryService.autoConfigureWebhook(projectId, userId, webhookUrl, events, webhookSecret);
    }

    @Override
    public Map<String, Object> refreshWebhookConfig(Long projectId, Long userId) {
        return webhookDeliveryService.refreshWebhookConfig(projectId, userId);
    }
}
