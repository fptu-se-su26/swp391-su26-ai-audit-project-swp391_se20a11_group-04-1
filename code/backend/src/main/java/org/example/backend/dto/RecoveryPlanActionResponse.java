package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryPlanActionResponse {
    private Long id;
    private String actionType;
    private Long targetUserId;
    private String status;
    private String priority;
    private String message;
    private String payload;
    private String idempotencyKey;
    private LocalDateTime executedAt;
    private String resultMessage;
    private LocalDateTime createdAt;
}
