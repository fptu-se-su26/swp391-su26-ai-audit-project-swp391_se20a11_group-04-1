package org.example.backend.service.github.code;

import org.example.backend.entity.GitHubIntegration;

import java.util.Map;

public interface GitHubPullRequestEventHandler {
    void handlePullRequestEvent(Map<String, Object> payload, GitHubIntegration integration);
}
