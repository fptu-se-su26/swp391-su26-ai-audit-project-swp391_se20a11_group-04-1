package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.backend.entity.SlaAnalysisJob;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlaAnalysisJobResponse {
    private Long id;
    private Long projectId;
    private Long sprintId;
    private String status;
    private Long triggeredBy;
    private LocalDateTime createdAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String errorMessage;
    private SlaReliabilityReportResponse report;

    public static SlaAnalysisJobResponse fromEntity(SlaAnalysisJob job) {
        return SlaAnalysisJobResponse.builder()
                .id(job.getId())
                .projectId(job.getProjectId())
                .sprintId(job.getSprintId())
                .status(job.getStatus())
                .triggeredBy(job.getTriggeredBy())
                .createdAt(job.getCreatedAt())
                .startedAt(job.getStartedAt())
                .completedAt(job.getCompletedAt())
                .errorMessage(job.getErrorMessage())
                .build();
    }
}
