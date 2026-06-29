package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;
import org.example.backend.entity.AuditLog;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {
    private Long id;
    private Long userId;
    private String username;
    private String action;
    private String entityType;
    private Long entityId;
    private String ipAddress;
    private String httpMethod;
    private String requestUri;
    private String status;
    private String errorMessage;
    private Long durationMs;
    private LocalDateTime createdAt;

    public static AuditLogResponse fromEntity(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .username(log.getUsername())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .ipAddress(log.getIpAddress())
                .httpMethod(log.getHttpMethod())
                .requestUri(log.getRequestUri())
                .status(log.getStatus())
                .errorMessage(log.getErrorMessage())
                .durationMs(log.getDurationMs())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
