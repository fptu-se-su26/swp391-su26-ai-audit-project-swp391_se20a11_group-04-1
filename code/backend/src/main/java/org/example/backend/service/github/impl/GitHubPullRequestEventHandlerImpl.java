package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.code.GitHubPullRequestEventHandler;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubPullRequestEventHandlerImpl implements GitHubPullRequestEventHandler {

    private final GitHubEvidenceService evidenceService;

    @Override
    public void handlePullRequestEvent(Map<String, Object> payload, GitHubIntegration integration) {
        Object pullRequest = payload.get("pull_request");
        if (pullRequest instanceof Map<?, ?> map) {
            evidenceService.upsertPullRequest(integration, (Map<String, Object>) map);
        }
    }
}
