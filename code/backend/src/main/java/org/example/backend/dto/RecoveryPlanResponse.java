package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryPlanResponse {
    private Long id;
    private Long projectId;
    private Long sprintId;
    private Long taskId;
    private Long generatedByUserId;
    private String status;
    private String riskLevel;
    private List<String> riskCategories;
    private String summary;
    private String generatedSource;
    private String rejectReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RecoveryPlanActionResponse> actions;
    private List<RecoveryPlanAuditLogResponse> auditLogs;
}
