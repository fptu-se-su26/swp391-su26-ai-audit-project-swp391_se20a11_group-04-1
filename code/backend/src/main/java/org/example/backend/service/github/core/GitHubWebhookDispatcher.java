package org.example.backend.service.github.core;

import org.example.backend.entity.GitHubIntegration;

import java.util.Map;

public interface GitHubWebhookDispatcher {
    void dispatch(String eventType, Map<String, Object> payload, GitHubIntegration integration);
}
