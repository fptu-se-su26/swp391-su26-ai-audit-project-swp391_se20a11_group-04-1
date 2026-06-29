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
public class HealthSummaryResponse {
    private String overallStatus; // "UP", "WARN", "DOWN"
    private List<ComponentHealth> components;
    private LocalDateTime lastCheckedAt;
}
