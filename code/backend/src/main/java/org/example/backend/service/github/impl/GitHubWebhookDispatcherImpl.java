package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.core.GitHubWebhookDispatcher;
import org.example.backend.service.github.issue.GitHubIssueEventHandler;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GitHubWebhookDispatcherImpl implements GitHubWebhookDispatcher {

    private final GitHubIssueEventHandler issueEventHandler;

    @Override
    public void dispatch(String eventType, Map<String, Object> payload, GitHubIntegration integration) {
        if ("ping".equalsIgnoreCase(eventType)) {
            log.info("Received GitHub ping webhook for repo {}/{}", integration.getRepoOwner(), integration.getRepoName());
            return;
        }
        if ("issues".equalsIgnoreCase(eventType)) {
            String action = (String) payload.get("action");
            Map<String, Object> issue = (Map<String, Object>) payload.get("issue");
            issueEventHandler.handleIssueEvent(action, issue, payload, integration);
            return;
        }
        log.debug("Ignored unsupported GitHub webhook event: {}", eventType);
    }
}
