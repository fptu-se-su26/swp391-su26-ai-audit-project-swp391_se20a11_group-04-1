package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskSlaPauseSummaryResponse {
    private Long taskId;
    private Long projectId;
    private long totalPausedMinutes;
    private boolean currentlyPaused;
    private LocalDateTime currentPauseStartedAt;
    private List<PauseLogItem> logs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PauseLogItem {
        private Long id;
        private LocalDateTime pausedAt;
        private LocalDateTime resumedAt;
        private String reason;
    }
}
