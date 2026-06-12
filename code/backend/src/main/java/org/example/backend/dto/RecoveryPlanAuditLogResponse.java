package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecoveryPlanAuditLogResponse {
    private Long id;
    private Long recoveryPlanId;
    private Long recoveryPlanActionId;
    private Long projectId;
    private Long taskId;
    private Long actorUserId;
    private String eventType;
    private String fromStatus;
    private String toStatus;
    private String message;
    private String metadata;
    private LocalDateTime createdAt;
}
