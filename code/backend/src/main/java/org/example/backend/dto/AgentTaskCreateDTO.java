package org.example.backend.dto;

import lombok.Data;

@Data
public class AgentTaskCreateDTO {
    private Long testRunId;
    private Long executionId;
    private Long projectId;
    private String script;
    private String baseUrl;
    private String taskType;
}
