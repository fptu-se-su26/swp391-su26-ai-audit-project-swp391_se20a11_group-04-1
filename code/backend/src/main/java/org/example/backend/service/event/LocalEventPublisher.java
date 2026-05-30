package org.example.backend.service.event;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.OutboxEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.events.publisher", havingValue = "local", matchIfMissing = true)
@Slf4j
public class LocalEventPublisher implements EventPublisher {

    @Override
    public void publish(OutboxEvent event) {
        log.info("Local event published: id={}, type={}, aggregateType={}, aggregateId={}",
                event.getId(), event.getEventType(), event.getAggregateType(), event.getAggregateId());
    }
}
