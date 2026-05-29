package org.example.backend.service.event;

import org.example.backend.entity.OutboxEvent;

public interface EventPublisher {
    void publish(OutboxEvent event);
}
