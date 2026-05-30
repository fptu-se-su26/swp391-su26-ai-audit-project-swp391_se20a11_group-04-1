package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxSummaryResponse {
    private long pendingCount;
    private long failedCount;
    private long publishedTodayCount;
    private String latestError;
}
