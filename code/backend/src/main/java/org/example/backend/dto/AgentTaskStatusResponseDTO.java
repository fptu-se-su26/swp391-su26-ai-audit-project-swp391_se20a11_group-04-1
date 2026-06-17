package org.example.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;
import org.example.backend.entity.enums.AgentTaskStatus;

@Data
@Builder
public class AgentTaskStatusResponseDTO {
    private AgentTaskStatus status;
    private JsonNode result;
}
