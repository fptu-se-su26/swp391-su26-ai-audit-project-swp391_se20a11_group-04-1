package org.example.backend.service.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.NotificationWebSocketHandler;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.events.publisher", havingValue = "kafka")
public class KafkaNotificationConsumer {

    private final ObjectMapper objectMapper;

    @KafkaListener(topics = {
            "devtrack.task.events",
            "devtrack.notification.events",
            "devtrack.sla.events",
            "devtrack.email.commands"
    })
    public void consume(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            String eventType = root.path("eventType").asText("UNKNOWN_EVENT");
            JsonNode payload = root.has("payload") ? root.path("payload") : root;
            Long userId = resolveUserId(payload);
            if (userId == null) {
                log.debug("Kafka notification event {} skipped because no userId/assigneeId was present", eventType);
                return;
            }

            ObjectNode websocketPayload = objectMapper.createObjectNode();
            websocketPayload.put("type", "SLA_ALERT");
            websocketPayload.put("eventType", eventType);
            websocketPayload.set("payload", payload);
            NotificationWebSocketHandler.sendToUser(userId, objectMapper.writeValueAsString(websocketPayload));
        } catch (Exception ex) {
            log.error("Failed to consume Kafka notification message: {}", message, ex);
        }
    }

    private Long resolveUserId(JsonNode payload) {
        JsonNode assigneeId = payload.get("assigneeId");
        if (assigneeId != null && assigneeId.canConvertToLong()) {
            return assigneeId.asLong();
        }
        JsonNode userId = payload.get("userId");
        if (userId != null && userId.canConvertToLong()) {
            return userId.asLong();
        }
        return null;
    }
}
