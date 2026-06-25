package org.example.backend.service.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.repository.OutboxEventRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxEventService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public OutboxEvent createEvent(String eventType, String aggregateType, Long aggregateId, Map<String, Object> payload) {
        String payloadJson = toJson(payload);
        String idempotencyKey = generateIdempotencyKey(eventType, aggregateId, payloadJson);

        try {
            return outboxEventRepository.saveAndFlush(OutboxEvent.builder()
                    .eventType(eventType)
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .payload(payloadJson)
                    .idempotencyKey(idempotencyKey)
                    .build());
        } catch (DataIntegrityViolationException ex) {
            log.debug("Duplicate event detected, skipping insertion for key: {}", idempotencyKey);
            return outboxEventRepository.findByIdempotencyKey(idempotencyKey)
                    .orElseThrow(() -> ex);
        }
    }

    private String generateIdempotencyKey(String eventType, Long aggregateId, String payloadJson) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String raw = eventType + ":" + aggregateId + ":" + payloadJson;
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Invalid event payload", ex);
        }
    }
}
