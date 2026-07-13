package org.example.backend.service.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.entity.ProcessedEvent;
import org.example.backend.repository.ProcessedEventRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
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

    // Key inflight: tổng số job đã gửi Kafka nhưng chưa callback kết quả về backend
    public static final String INFLIGHT_KEY = "kafka:testrun:inflight";

    // Key partition mapping: kafka:testrun:{testRunId}:partition → partition number
    // Backend tự ghi sau khi Kafka confirm send (lấy từ RecordMetadata)
    // → Không còn phụ thuộc vào worker Node.js để biết job ở partition nào
    public static final String TESTRUN_PARTITION_KEY_PREFIX = "kafka:testrun:";
    public static final String TESTRUN_PARTITION_KEY_SUFFIX = ":partition";

    // Key active jobs per partition: kafka:partition:{N}:active → counter
    public static final String PARTITION_ACTIVE_KEY_PREFIX = "kafka:partition:";
    public static final String PARTITION_ACTIVE_KEY_SUFFIX = ":active";

    // TTL đủ dài để cover cả test run chậm nhất (~1 giờ), tránh key leak khi worker crash
    private static final Duration TRACKING_TTL = Duration.ofHours(1);

    @Override
    public void publish(OutboxEvent event) {
        // Dedup check: dùng saveAndFlush trong transaction hiện tại
        // ProcessedEvent có unique constraint trên idempotencyKey
        // Nếu OutboxPublisherService chạy 2 batch đồng thời với cùng event,
        // lần 2 sẽ throw DataIntegrityViolationException → return sớm trước khi gửi Kafka
        try {
            processedEventRepository.saveAndFlush(ProcessedEvent.builder()
                    .idempotencyKey(event.getIdempotencyKey())
                    .consumerId("kafka_publisher")
                    .build());
        } catch (DataIntegrityViolationException ex) {
            log.warn("Skipping duplicate event: {}", event.getIdempotencyKey());
            return;
        }

        // Dùng aggregateId làm key để cùng testRunId luôn vào cùng partition
        String key = event.getAggregateId() != null
                ? String.valueOf(event.getAggregateId())
                : null;

        // Gửi lên Kafka và đợi broker confirm (join = blocking send)
        // SendResult chứa RecordMetadata → biết chính xác partition nào nhận message
        SendResult<String, String> result = kafkaTemplate.send(resolveTopic(event), key, event.getPayload()).join();

        // Sau khi Kafka confirm, backend tự track partition activity
        // → Loại bỏ hoàn toàn sự phụ thuộc vào worker Node.js Redis client
        if ("TEST_RUN_JOB".equals(event.getEventType()) && event.getAggregateId() != null) {
            try {
                RecordMetadata meta = result.getRecordMetadata();
                int partition = meta.partition();
                Long testRunId = event.getAggregateId();

                String partitionActiveKey = PARTITION_ACTIVE_KEY_PREFIX + partition + PARTITION_ACTIVE_KEY_SUFFIX;
                String testRunPartitionKey = TESTRUN_PARTITION_KEY_PREFIX + testRunId + TESTRUN_PARTITION_KEY_SUFFIX;

                // Guard dedup: dùng SET NX (set if not exists) trên mapping key để đảm bảo
                // chỉ INCR đúng 1 lần dù OutboxPublisherService có thể gọi publish() nhiều lần
                // trong khi transaction chưa commit (fixedDelay=3s < Kafka send time)
                Boolean isNew = redisTemplate.opsForValue()
                        .setIfAbsent(testRunPartitionKey, String.valueOf(partition), TRACKING_TTL);

                if (Boolean.TRUE.equals(isNew)) {
                    // Lần đầu tiên publish event này → INCR counter
                    Long activeCount = redisTemplate.opsForValue().increment(partitionActiveKey);
                    redisTemplate.expire(partitionActiveKey, TRACKING_TTL);

                    // Increment inflight counter (dùng cho totalLag fallback khi Kafka lag = 0)
                    Long inflightCount = redisTemplate.opsForValue().increment(INFLIGHT_KEY);
                    if (inflightCount != null && inflightCount == 1L) {
                        redisTemplate.expire(INFLIGHT_KEY, Duration.ofMinutes(30));
                    }

                    // Xóa cache cũ ngay lập tức để dashboard poll lại thấy activeJobs mới
                    redisTemplate.delete("admin:resource:kafkaStatus");

                    log.debug("[Tracking] TestRun {} → partition {}, active={}, inflight={}",
                            testRunId, partition, activeCount, inflightCount);
                } else {
                    // Duplicate publish (Outbox retry trước khi commit) → bỏ qua, không INCR lại
                    log.debug("[Tracking] Duplicate publish detected for TestRun {}, skipping INCR", testRunId);
                }
            } catch (Exception e) {
                log.warn("[Tracking] Failed to update partition tracking after Kafka send (non-fatal)", e);
            }
        }
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
