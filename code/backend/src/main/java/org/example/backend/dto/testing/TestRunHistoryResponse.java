package org.example.backend.dto.testing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRunHistoryResponse {
    private Long id;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Long durationMs;
    private int passedCount;
    private int failedCount;
    private Boolean isSaved;
}
