package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AgentTaskResponseDTO {
    private UUID taskId;
    private Long testRunId;
    private Long executionId;
    private String script;
    private String baseUrl;
    private String wsUrl;
    private String runId;
}
