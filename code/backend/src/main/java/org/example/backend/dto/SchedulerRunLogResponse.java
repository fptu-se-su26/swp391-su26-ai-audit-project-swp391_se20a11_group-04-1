package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.backend.entity.SchedulerRunLog;

import java.time.LocalDateTime;
import java.time.Duration;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchedulerRunLogResponse {
    private Long id;
    private String jobName;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private int totalScanned;
    private int totalCreated;
    private int totalSent;
    private String errorMessage;
    private Long durationSeconds;

    public static SchedulerRunLogResponse fromEntity(SchedulerRunLog log) {
        Long duration = null;
        if (log.getFinishedAt() != null && log.getStartedAt() != null) {
            duration = Duration.between(log.getStartedAt(), log.getFinishedAt()).getSeconds();
        }

        return SchedulerRunLogResponse.builder()
                .id(log.getId())
                .jobName(log.getJobName())
                .status(log.getStatus())
                .startedAt(log.getStartedAt())
                .finishedAt(log.getFinishedAt())
                .totalScanned(log.getTotalScanned())
                .totalCreated(log.getTotalCreated())
                .totalSent(log.getTotalSent())
                .errorMessage(log.getErrorMessage())
                .durationSeconds(duration)
                .build();
    }
}
