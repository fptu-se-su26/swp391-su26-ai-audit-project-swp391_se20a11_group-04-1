package org.example.backend.service.event;

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

    @Override
    public void publish(OutboxEvent event) {
        kafkaTemplate.send(resolveTopic(event), String.valueOf(event.getAggregateId()), event.getPayload()).join();
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
