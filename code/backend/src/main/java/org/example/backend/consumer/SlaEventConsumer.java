package org.example.backend.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.service.sla.SlaStateService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SlaEventConsumer {

    private final ObjectMapper objectMapper;
    private final SlaStateService slaStateService;

    @KafkaListener(
            topics = {"devtrack.task.events", "devtrack.sla.events"},
            groupId = "devtrack-sla-consumer"
    )
    public void consume(String payload) {
        log.info("Received event payload from Kafka: {}", payload);
        try {
            JsonNode jsonNode = objectMapper.readTree(payload);

            String eventType = jsonNode.has("eventType") ? jsonNode.get("eventType").asText() : "UNKNOWN";

            Long taskId = null;
            if (jsonNode.has("taskId") && !jsonNode.get("taskId").isNull()) {
                taskId = jsonNode.get("taskId").asLong();
            } else if (jsonNode.has("aggregateId") && !jsonNode.get("aggregateId").isNull()) {
                taskId = jsonNode.get("aggregateId").asLong();
            } else if (jsonNode.has("entityId") && !jsonNode.get("entityId").isNull()) {
                String entityType = jsonNode.has("entityType") ? jsonNode.get("entityType").asText() : "";
                if ("TASK".equalsIgnoreCase(entityType)) {
                    taskId = jsonNode.get("entityId").asLong();
                }
            }

            if (taskId == null) {
                log.debug("No taskId found in event payload (eventType: {}). Skipping processing. Payload: {}", eventType, payload);
                return;
            }

            if (!slaStateService.existsTask(taskId)) {
                log.warn("Task with ID {} does not exist in DB, skipping SLA evaluation. EventType: {}", taskId, eventType);
                return;
            }

            slaStateService.evaluateAndPersist(taskId, eventType);
        } catch (Exception ex) {
            log.error("Failed to process SLA event from Kafka. Payload: {}", payload, ex);
            throw new RuntimeException("Error processing SLA event from Kafka. Payload: " + payload, ex);
        }
    }
}
