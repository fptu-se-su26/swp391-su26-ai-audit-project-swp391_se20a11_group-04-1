package org.example.backend.dto;

import lombok.*;

import java.util.List;

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
    private List<OutboxEventActivityResponse> recentEvents;
}
