package org.example.backend.dto;

import java.time.LocalDateTime;

public record RtmSnapshotResponse(
        Long id,
        Long projectId,
        Long sprintId,
        LocalDateTime createdAt,
        RtmSummaryResponse summary,
        int rowCount
) {
}
