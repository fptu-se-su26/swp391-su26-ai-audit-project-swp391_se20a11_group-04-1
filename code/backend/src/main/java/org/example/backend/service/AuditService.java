package org.example.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.AuditLog;
import org.example.backend.event.AuditEvent;
import org.example.backend.repository.AuditLogRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher applicationEventPublisher;

    @EventListener
    @Async("auditExecutor")
    public void handleAuditEvent(AuditEvent event) {
        try {
            String oldValueStr = event.getOldValue() != null ? objectMapper.writeValueAsString(event.getOldValue()) : null;
            String newValueStr = event.getNewValue() != null ? objectMapper.writeValueAsString(event.getNewValue()) : null;

            AuditLog auditLog = AuditLog.builder()
                    .userId(event.getUserId())
                    .username(event.getUsername())
                    .action(event.getAction())
                    .entityType(event.getEntityType())
                    .entityId(event.getEntityId())
                    .oldValue(oldValueStr)
                    .newValue(newValueStr)
                    .ipAddress(event.getIpAddress())
                    .httpMethod(event.getHttpMethod())
                    .requestUri(event.getRequestUri())
                    .status(event.getStatus())
                    .errorMessage(event.getErrorMessage())
                    .durationMs(event.getDurationMs())
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log for action: {}", event.getAction(), e);
        }
    }

    public void publishSuccess(Long userId, String username, String action,
                               String entityType, Long entityId, Object newValue,
                               String ipAddress, String httpMethod, String uri, long durationMs) {
        applicationEventPublisher.publishEvent(new AuditEvent(this, userId, username, action, entityType, entityId,
                null, newValue, ipAddress, httpMethod, uri, "SUCCESS", null, durationMs));
    }

    public void publishFailure(Long userId, String username, String action,
                               String ipAddress, String httpMethod, String uri,
                               String errorMessage, long durationMs) {
        applicationEventPublisher.publishEvent(new AuditEvent(this, userId, username, action, null, null,
                null, null, ipAddress, httpMethod, uri, "FAILED", errorMessage, durationMs));
    }
}
