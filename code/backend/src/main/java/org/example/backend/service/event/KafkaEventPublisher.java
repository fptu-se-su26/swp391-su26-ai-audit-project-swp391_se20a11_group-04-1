package org.example.backend.service.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.entity.ProcessedEvent;
import org.example.backend.repository.ProcessedEventRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Service
@ConditionalOnProperty(name = "app.events.publisher", havingValue = "kafka")
@RequiredArgsConstructor
@Slf4j
public class KafkaEventPublisher implements EventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ProcessedEventRepository processedEventRepository;
    private final StringRedisTemplate redisTemplate;

    // Key dùng để dashboard đọc "inflight" counter — số jobs đã publish nhưng chưa có kết quả
    public static final String INFLIGHT_KEY = "kafka:testrun:inflight";

    @Override
    public void publish(OutboxEvent event) {
        try {
            processedEventRepository.saveAndFlush(ProcessedEvent.builder()
                    .idempotencyKey(event.getIdempotencyKey())
                    .consumerId("kafka_publisher")
                    .build());
        } catch (DataIntegrityViolationException ex) {
            log.warn("Skipping duplicate event: {}", event.getIdempotencyKey());
            return;
        }

        // Dùng aggregateId làm key để các test run khác nhau hash vào partition khác nhau
        // → Worker có thể xử lý song song nhờ partitionsConsumedConcurrently
        String key = event.getAggregateId() != null
                ? String.valueOf(event.getAggregateId())
                : null;

        // Track inflight count cho dashboard: increment trước khi send
        // Dashboard dùng counter này để hiển thị lag dù consumer kịp commit offset
        if ("TEST_RUN_JOB".equals(event.getEventType())) {
            try {
                Long count = redisTemplate.opsForValue().increment(INFLIGHT_KEY);
                if (count != null && count == 1L) {
                    // Set TTL lần đầu để tránh key bị leak nếu worker crash
                    redisTemplate.expire(INFLIGHT_KEY, Duration.ofMinutes(30));
                }
                log.debug("Inflight test-run-jobs counter incremented to {}", count);
                // Invalidate kafka status cache ngay lập tức để dashboard poll lại
                // và hiển thị partition data mới thay vì data cũ từ idle state
                redisTemplate.delete("admin:resource:kafkaStatus");
            } catch (Exception e) {
                log.warn("Failed to increment inflight counter", e);
            }
        }

        kafkaTemplate.send(resolveTopic(event), key, event.getPayload()).join();
    }

    private String resolveTopic(OutboxEvent event) {
        if ("TEST_RUN_JOB".equals(event.getEventType())) {
            return "test-run-jobs";
        }
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
