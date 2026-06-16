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

    private java.util.Map<String, Object> extraProperties = new java.util.HashMap<>();

    @com.fasterxml.jackson.annotation.JsonAnySetter
    public void setExtraProperty(String key, Object value) {
        extraProperties.put(key, value);
    }

    @com.fasterxml.jackson.annotation.JsonAnyGetter
    public java.util.Map<String, Object> getExtraProperties() {
        return extraProperties;
    }
}
