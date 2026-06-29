package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.backend.entity.EntitySyncLog;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntitySyncLogResponse {
    private Long id;
    private String entityType;
    private Long entityId;
    private String triggerType;
    private String status;
    private Integer retryCount;
    private Long durationMs;
    private String errorMessage;
    private LocalDateTime nextRetryAt;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;

    public static EntitySyncLogResponse fromEntity(EntitySyncLog log) {
        if (log == null) {
            return null;
        }
        return EntitySyncLogResponse.builder()
                .id(log.getId())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .triggerType(log.getTriggerType())
                .status(log.getStatus())
                .retryCount(log.getRetryCount())
                .durationMs(log.getDurationMs())
                .errorMessage(log.getErrorMessage())
                .nextRetryAt(log.getNextRetryAt())
                .createdAt(log.getCreatedAt())
                .completedAt(log.getCompletedAt())
                .build();
    }
}
