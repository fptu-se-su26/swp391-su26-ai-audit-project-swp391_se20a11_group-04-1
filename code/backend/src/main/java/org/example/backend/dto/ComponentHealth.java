package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentHealth {
    private String component;
    private String status;
    private String message;
    private Long responseTimeMs;
    private LocalDateTime checkedAt;
}
