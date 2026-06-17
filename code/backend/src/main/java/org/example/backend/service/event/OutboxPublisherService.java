package org.example.backend.service.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.repository.OutboxEventRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisherService {

    private static final int BATCH_SIZE = 50;
    private static final int MAX_RETRIES = 3;

    private final OutboxEventRepository outboxEventRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public int publishPendingEvents() {
        LocalDateTime now = LocalDateTime.now();
        List<OutboxEvent> events = outboxEventRepository.findPublishableEvents(
                now,
                MAX_RETRIES,
                PageRequest.of(0, BATCH_SIZE));
        int published = 0;
        for (OutboxEvent event : events) {
            try {
                eventPublisher.publish(event);
                event.setStatus("PUBLISHED");
                event.setPublishedAt(LocalDateTime.now());
                event.setNextRetryAt(null);
                event.setLastError(null);
                published++;
            } catch (Exception ex) {
                log.error("Failed to publish outbox event {}", event.getId(), ex);
                int nextRetryCount = event.getRetryCount() + 1;
                event.setRetryCount(nextRetryCount);
                event.setStatus(nextRetryCount >= MAX_RETRIES ? "DEAD" : "FAILED");
                event.setLastError(ex.getMessage());
                event.setNextRetryAt(nextRetryCount >= MAX_RETRIES
                        ? null
                        : LocalDateTime.now().plus(retryDelay(nextRetryCount)));
            }
        }
        return published;
    }

    private Duration retryDelay(int retryCount) {
        return switch (retryCount) {
            case 1 -> Duration.ofSeconds(30);
            case 2 -> Duration.ofMinutes(5);
            default -> Duration.ofMinutes(30);
        };
    }
}
