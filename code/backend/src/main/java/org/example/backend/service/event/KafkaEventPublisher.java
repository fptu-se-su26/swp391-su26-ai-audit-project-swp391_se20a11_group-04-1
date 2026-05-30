package org.example.backend.service.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.example.backend.entity.OutboxEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.events.publisher", havingValue = "kafka")
@RequiredArgsConstructor
public class KafkaEventPublisher implements EventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void publish(OutboxEvent event) {
        kafkaTemplate.send(resolveTopic(event), String.valueOf(event.getAggregateId()), toEnvelope(event)).join();
    }

    private String toEnvelope(OutboxEvent event) {
        try {
            ObjectNode envelope = objectMapper.createObjectNode();
            envelope.put("eventType", event.getEventType());
            envelope.set("payload", objectMapper.readTree(event.getPayload()));
            return objectMapper.writeValueAsString(envelope);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid outbox event payload", ex);
        }
    }

    private String resolveTopic(OutboxEvent event) {
        if (event.getEventType().startsWith("TASK_")) {
            return "devtrack.task.events";
        }
        if (event.getEventType().startsWith("EMAIL_")) {
            return "devtrack.email.commands";
        }
        if (event.getEventType().contains("DIGEST")) {
            return "devtrack.notification.events";
        }
        return "devtrack.sla.events";
    }
}
