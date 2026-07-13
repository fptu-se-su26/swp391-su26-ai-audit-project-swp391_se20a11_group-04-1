package org.example.backend.dto.admin.resource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KedaScalerInfo {
    private int minReplicas;
    private int maxReplicas;
    private int currentReplicas;
    private int lagThreshold;
    // Renamed from "isActive" to "active" to avoid Lombok @Data + Jackson boolean getter conflict.
    // Lombok generates getActive(), Jackson serializes cleanly as "active".
    private boolean active;
    private int cooldownPeriod;
    private String lastScaleTime;
}
