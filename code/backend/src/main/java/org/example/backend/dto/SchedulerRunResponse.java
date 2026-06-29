package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchedulerRunResponse {
    private String jobName;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private int totalScanned;
    private int totalCreated;
    private int totalSent;
    private String errorMessage;
}
