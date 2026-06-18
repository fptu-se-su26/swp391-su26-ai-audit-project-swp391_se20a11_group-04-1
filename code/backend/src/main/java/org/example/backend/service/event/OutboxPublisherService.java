package org.example.backend.service.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.repository.OutboxEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisherService {

    private final OutboxEventRepository outboxEventRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public int publishPendingEvents() {
        List<OutboxEvent> events = outboxEventRepository.findTop50ByStatusOrderByCreatedAtAsc("PENDING");
        int published = 0;
        for (OutboxEvent event : events) {
            try {
                eventPublisher.publish(event);
                event.setStatus("PUBLISHED");
                event.setPublishedAt(LocalDateTime.now());
                event.setLastError(null);
                published++;
            } catch (Exception ex) {
                log.error("Failed to publish outbox event {}", event.getId(), ex);
                event.setStatus("FAILED");
                event.setRetryCount(event.getRetryCount() + 1);
                event.setLastError(ex.getMessage());
            }
        }
        return published;
    }
}
