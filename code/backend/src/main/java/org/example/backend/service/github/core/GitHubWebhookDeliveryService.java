package org.example.backend.service.github.core;

import java.util.List;
import java.util.Map;

public interface GitHubWebhookDeliveryService {
    Map<String, Object> getWebhookDeliveryStatus(Long projectId, Long userId);

    void pingWebhook(Long projectId, Long userId);

    Map<String, Object> getRateLimit(Long projectId, Long userId);

    Object getWebhookDeliveries(Long projectId, Long userId);

    void redeliverWebhook(Long projectId, Long deliveryId, Long userId);

    void autoConfigureWebhook(Long projectId, Long userId, String webhookUrl, List<String> events, String webhookSecret);
}
