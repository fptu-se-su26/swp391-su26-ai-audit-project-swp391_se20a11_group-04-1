package org.example.backend.dto;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OutboxStatsResponse {
    private long pending;
    private long published;
    private long dead;
    private long dlqCount;
}
