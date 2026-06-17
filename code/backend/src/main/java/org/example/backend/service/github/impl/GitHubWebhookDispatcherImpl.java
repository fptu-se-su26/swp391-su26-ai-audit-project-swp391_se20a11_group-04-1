package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.code.GitHubCheckRunEventHandler;
import org.example.backend.service.github.code.GitHubPullRequestEventHandler;
import org.example.backend.service.github.code.GitHubPushEventHandler;
import org.example.backend.service.github.code.GitHubWorkflowRunEventHandler;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.example.backend.service.github.core.GitHubWebhookDispatcher;
import org.example.backend.service.github.issue.GitHubIssueEventHandler;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GitHubWebhookDispatcherImpl implements GitHubWebhookDispatcher {

    private final GitHubEvidenceService evidenceService;
    private final GitHubIssueEventHandler issueEventHandler;
    private final GitHubPushEventHandler pushEventHandler;
    private final GitHubPullRequestEventHandler pullRequestEventHandler;
    private final GitHubWorkflowRunEventHandler workflowRunEventHandler;
    private final GitHubCheckRunEventHandler checkRunEventHandler;

    @Override
    @Async
    public void dispatch(String eventType, Map<String, Object> payload, GitHubIntegration integration, Long eventId) {
        evidenceService.markProcessing(eventId);
        try {
            if ("ping".equalsIgnoreCase(eventType)) {
                log.info("Received GitHub ping webhook for repo {}/{}", integration.getRepoOwner(), integration.getRepoName());
                evidenceService.markProcessed(eventId);
                return;
            }
            if ("issues".equalsIgnoreCase(eventType)) {
                String action = (String) payload.get("action");
                Map<String, Object> issue = (Map<String, Object>) payload.get("issue");
                issueEventHandler.handleIssueEvent(action, issue, payload, integration);
                evidenceService.markProcessed(eventId);
                return;
            }
            if ("push".equalsIgnoreCase(eventType)) {
                pushEventHandler.handlePushEvent(payload, integration);
                evidenceService.markProcessed(eventId);
                return;
            }
            if ("pull_request".equalsIgnoreCase(eventType)) {
                pullRequestEventHandler.handlePullRequestEvent(payload, integration);
                evidenceService.markProcessed(eventId);
                return;
            }
            if ("workflow_run".equalsIgnoreCase(eventType)) {
                workflowRunEventHandler.handleWorkflowRunEvent(payload, integration);
                evidenceService.markProcessed(eventId);
                return;
            }
            if ("check_run".equalsIgnoreCase(eventType)) {
                checkRunEventHandler.handleCheckRunEvent(payload, integration);
                evidenceService.markProcessed(eventId);
                return;
            }
            log.debug("Ignored unsupported GitHub webhook event: {}", eventType);
            evidenceService.markIgnored(eventId);
        } catch (Exception ex) {
            evidenceService.markFailed(eventId, ex.getMessage());
            log.error("Failed to dispatch GitHub webhook event: {}", eventType, ex);
        }
    }
}
