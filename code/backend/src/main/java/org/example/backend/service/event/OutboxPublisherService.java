package org.example.backend.service.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.DeadLetterEvent;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.repository.DeadLetterEventRepository;
import org.example.backend.repository.OutboxEventRepository;
import org.example.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.SmartLifecycle;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisherService implements SmartLifecycle {

    private static final int BATCH_SIZE = 50;
    private static final int MAX_RETRIES = 3;

    private final OutboxEventRepository outboxEventRepository;
    private final DeadLetterEventRepository deadLetterEventRepository;
    private final EventPublisher eventPublisher;
    private final EmailService emailService;

    @Value("${app.admin.email:admin@example.com}")
    private String adminEmail;

    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicInteger activeBatches = new AtomicInteger(0);

    @Override
    public boolean isAutoStartup() {
        return true;
    }

    @Override
    public void start() {
        running.set(true);
    }

    @Override
    public void stop() {
        running.set(false);
    }

    @Override
    public void stop(Runnable callback) {
        running.set(false);
        new Thread(() -> {
            long maxWait = System.currentTimeMillis() + 25000;
            while (activeBatches.get() > 0 && System.currentTimeMillis() < maxWait) {
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            callback.run();
        }).start();
    }

    @Override
    public int getPhase() {
        return Integer.MAX_VALUE - 1;
    }

    @Override
    public boolean isRunning() {
        return running.get();
    }

    @Transactional
    public int publishPendingEvents() {
        if (!isRunning()) return 0;
        activeBatches.incrementAndGet();
        try {
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
                    event.setLastError(ex.getMessage());
                    
                    if (nextRetryCount >= MAX_RETRIES) {
                        event.setStatus("DEAD");
                        event.setNextRetryAt(null);
                        handleDeadLetter(event, ex.getMessage());
                    } else {
                        event.setStatus("FAILED");
                        event.setNextRetryAt(LocalDateTime.now().plus(retryDelay(nextRetryCount)));
                    }
                }
            }
            return published;
        } finally {
            activeBatches.decrementAndGet();
        }
    }

    private void handleDeadLetter(OutboxEvent event, String reason) {
        DeadLetterEvent dlq = deadLetterEventRepository.findByOriginalEventId(event.getId())
                .orElseGet(() -> DeadLetterEvent.builder()
                        .originalEventId(event.getId())
                        .eventType(event.getEventType())
                        .aggregateId(String.valueOf(event.getAggregateId()))
                        .payload(event.getPayload())
                        .createdAt(LocalDateTime.now())
                        .build());
        
        dlq.setFailureReason(reason);
        // Do not delete DLQ when retry, just save it.
        deadLetterEventRepository.save(dlq);
        
        String subject = "⚠️ Dead Letter Event Alert";
        String body = String.format("Event Type: %s<br>Aggregate ID: %s<br>Reason: %s", 
                event.getEventType(), event.getAggregateId(), reason);
        try {
            emailService.sendEmail(adminEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send DLQ email alert", e);
        }
    }

    private Duration retryDelay(int retryCount) {
        return switch (retryCount) {
            case 1 -> Duration.ofSeconds(30);
            case 2 -> Duration.ofMinutes(5);
            default -> Duration.ofMinutes(30);
        };
    }
}
