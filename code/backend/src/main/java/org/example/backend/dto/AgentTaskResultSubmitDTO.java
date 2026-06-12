package org.example.backend.dto;

import lombok.Data;

@Data
public class AgentTaskResultSubmitDTO {
    private String outcome;
    private String notes;
    private Long durationMs;
    private Integer failedStepIndex;
    private Object steps;   // Dùng Object thay JsonNode để tránh conflict Jackson 2.x vs 3.x
    private java.util.List<String> evidenceUrls;
}
