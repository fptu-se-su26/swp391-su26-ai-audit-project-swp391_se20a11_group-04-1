package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PodInfo {
    private String name;
    /** Running / Pending / CrashLoopBackOff / Error / Unknown */
    private String status;
    private int restarts;
    private String cpuRequest;
    private String memoryRequest;
    private String cpuLimit;
    private String memoryLimit;
    /** Human-readable uptime, e.g. "2d 3h" */
    private String age;
    private String nodeName;
}
