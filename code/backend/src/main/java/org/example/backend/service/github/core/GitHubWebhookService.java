package org.example.backend.service.github.core;

public interface GitHubWebhookService {
    void handleWebhook(String signatureHeader, String eventType, byte[] payloadBytes);
}
