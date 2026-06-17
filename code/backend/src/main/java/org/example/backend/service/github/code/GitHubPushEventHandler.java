package org.example.backend.service.github.code;

import org.example.backend.entity.GitHubIntegration;

import java.util.Map;

public interface GitHubPushEventHandler {
    void handlePushEvent(Map<String, Object> payload, GitHubIntegration integration);
}
