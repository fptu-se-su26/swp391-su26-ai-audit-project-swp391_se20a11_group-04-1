package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncStatsResponse {
    private long pending;
    private long success;
    private long failed;
    private long retryPending;
    private long dead;
}
