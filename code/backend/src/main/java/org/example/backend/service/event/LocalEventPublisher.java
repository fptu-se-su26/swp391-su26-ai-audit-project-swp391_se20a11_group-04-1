package org.example.backend.service.event;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.entity.ProcessedEvent;
import org.example.backend.repository.ProcessedEventRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.context.ApplicationEventPublisher;
import lombok.RequiredArgsConstructor;

@Service
@ConditionalOnProperty(name = "app.events.publisher", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class LocalEventPublisher implements EventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;
    private final ProcessedEventRepository processedEventRepository;

    @Override
    public void publish(OutboxEvent event) {
        if (!markAsProcessed(event.getIdempotencyKey())) {
            log.warn("Skipping duplicate event: {}", event.getIdempotencyKey());
            return;
        }
        log.info("Local event published: id={}, type={}, aggregateType={}, aggregateId={}",
                event.getId(), event.getEventType(), event.getAggregateType(), event.getAggregateId());
        applicationEventPublisher.publishEvent(event);
    }

    // REQUIRES_NEW — commit ProcessedEvent independently so it survives outer tx rollback
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean markAsProcessed(String idempotencyKey) {
        try {
            processedEventRepository.saveAndFlush(ProcessedEvent.builder()
                    .idempotencyKey(idempotencyKey)
                    .consumerId("local_publisher")
                    .build());
            return true;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }
}
