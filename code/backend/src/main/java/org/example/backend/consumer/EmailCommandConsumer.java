package org.example.backend.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.BackOff;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.events.publisher", havingValue = "kafka")
@RequiredArgsConstructor
public class EmailCommandConsumer {

    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "devtrack.email.commands", groupId = "devtrack-email-consumer")
    @RetryableTopic(
            attempts = "3",
            backOff = @BackOff(delay = 2000, multiplier = 2.0),
            autoCreateTopics = "true"
    )
    public void consume(String payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            String eventType = node.has("eventType") ? node.get("eventType").asText() : "UNKNOWN";

            switch (eventType) {
                case "EMAIL_DAILY_DIGEST_SENT" -> {
                    Long digestId = node.has("digestId") ? node.get("digestId").asLong() : null;
                    String email  = node.has("email")    ? node.get("email").asText()    : "unknown";
                    log.info("[email-audit] DAILY_DIGEST_SENT — digestId={}, recipient={}", digestId, email);
                }
                default -> log.warn("[email-audit] Unhandled EMAIL event type '{}'. Payload: {}", eventType, payload);
            }
        } catch (Exception ex) {
            log.error("[email-audit] Failed to process email command. Payload: {}", payload, ex);
            throw new RuntimeException("Error processing email command. Payload: " + payload, ex);
        }
    }

    @DltHandler
    public void consumeDlt(String payload) {
        log.error("[email-audit] Email command moved to DLT after retries. Payload: {}", payload);
    }
}
