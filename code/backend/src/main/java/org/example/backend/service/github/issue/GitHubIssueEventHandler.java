package org.example.backend.service.github.issue;

import org.example.backend.entity.GitHubIntegration;

import java.util.Map;

public interface GitHubIssueEventHandler {
    void handleIssueEvent(String action, Map<String, Object> issue, Map<String, Object> payload, GitHubIntegration integration);
}
