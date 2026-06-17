package org.example.backend.service.github.core;

import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.GitHubWebhookEvent;

import java.util.Map;
import java.util.Optional;

public interface GitHubEvidenceService {
    Optional<GitHubWebhookEvent> savePendingEvent(
            GitHubIntegration integration,
            String deliveryId,
            String eventType,
            String signature,
            String payloadHash,
            Map<String, Object> payload);

    void markProcessing(Long eventId);

    void markProcessed(Long eventId);

    void markIgnored(Long eventId);

    void markFailed(Long eventId, String errorMessage);

    void upsertCommit(GitHubIntegration integration, Map<String, Object> commit, String branchName);

    void upsertPullRequest(GitHubIntegration integration, Map<String, Object> pullRequest);

    void upsertWorkflowRun(GitHubIntegration integration, Map<String, Object> workflowRun);

    void upsertCheckRun(GitHubIntegration integration, Map<String, Object> checkRun);
}
