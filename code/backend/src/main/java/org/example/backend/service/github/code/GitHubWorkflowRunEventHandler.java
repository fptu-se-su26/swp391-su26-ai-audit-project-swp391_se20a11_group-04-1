package org.example.backend.service.github.code;

import org.example.backend.entity.GitHubIntegration;

import java.util.Map;

public interface GitHubWorkflowRunEventHandler {
    void handleWorkflowRunEvent(Map<String, Object> payload, GitHubIntegration integration);
}
