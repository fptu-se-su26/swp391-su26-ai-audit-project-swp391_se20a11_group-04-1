package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.backend.entity.MonitoredJobStat;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobStatResponse {
    private String jobName;
    private String status;
    private Long durationMs;
    private String errorMessage;
    private Integer consecutiveFailures;
    private LocalDateTime executedAt;

    public static JobStatResponse fromEntity(MonitoredJobStat stat) {
        if (stat == null) return null;
        return JobStatResponse.builder()
                .jobName(stat.getJobName())
                .status(stat.getStatus())
                .durationMs(stat.getDurationMs())
                .errorMessage(stat.getErrorMessage())
                .consecutiveFailures(stat.getConsecutiveFailures())
                .executedAt(stat.getExecutedAt())
                .build();
    }
}
