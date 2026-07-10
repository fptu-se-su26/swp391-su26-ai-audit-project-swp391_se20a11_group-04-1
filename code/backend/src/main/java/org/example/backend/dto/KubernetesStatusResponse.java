package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class KubernetesStatusResponse {

    private String status; // OK | UNAVAILABLE
    private String message;

    private KedaScalerInfo scaler;
    private List<PodInfo> pods;

    @Data
    @Builder
    public static class PodInfo {
        private String name;
        private String phase;       // Running | Pending | Failed | Succeeded | Unknown
        private String readyStatus; // e.g. "1/1"
        private int restarts;
        private String cpuRequest;
        private String memoryRequest;
        private String cpuLimit;
        private String memoryLimit;
        private String age;         // human-readable, e.g. "2d3h"
        private String nodeName;
    }

    @Data
    @Builder
    public static class KedaScalerInfo {
        private String name;
        private int minReplicas;
        private int maxReplicas;
        private int currentReplicas;
        private int desiredReplicas;
        private long lagThreshold;
        private boolean isActive;
        private String cooldownPeriod; // e.g. "60s"
        private String pollingInterval; // e.g. "15s"
        private String lastActiveTime;
        private String scalerStatus;    // Active | Idle | Paused | Unknown
    }
}
