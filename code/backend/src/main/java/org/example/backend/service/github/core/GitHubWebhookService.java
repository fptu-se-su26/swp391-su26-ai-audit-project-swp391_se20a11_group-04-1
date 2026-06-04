package org.example.backend.service.github.core;

public interface GitHubWebhookService {
    void handleWebhook(String signatureHeader, String deliveryId, String eventType, byte[] payloadBytes);
}
