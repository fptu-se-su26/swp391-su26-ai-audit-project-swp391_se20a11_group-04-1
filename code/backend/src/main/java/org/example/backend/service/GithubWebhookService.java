package org.example.backend.service;

import org.example.backend.dto.GithubWebhookResponse;

public interface GithubWebhookService {
    // Validate GitHub delivery headers/signature and store the raw payload for later processing.
    GithubWebhookResponse receiveWebhook(String eventType, String deliveryId, String signature, String payload);
}
