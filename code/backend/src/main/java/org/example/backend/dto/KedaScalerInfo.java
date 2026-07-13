package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KedaScalerInfo {
    private String name;
    private int minReplicas;
    private int maxReplicas;
    private int currentReplicas;
    private int desiredReplicas;
    private long lagThreshold;
    private int cooldownPeriod;
    private int pollingInterval;
    /** true = KEDA đang scale up do lag vượt ngưỡng */
    private boolean isActive;
    /** READY / NOT_READY / UNKNOWN */
    private String readyStatus;
    /** PAUSED / ACTIVE / FALLBACK / UNKNOWN */
    private String pauseStatus;
}
