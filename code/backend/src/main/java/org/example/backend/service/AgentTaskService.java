package org.example.backend.service;

import org.example.backend.dto.AgentTaskCreateDTO;
import org.example.backend.dto.AgentTaskResponseDTO;
import org.example.backend.dto.AgentTaskResultSubmitDTO;
import org.example.backend.dto.AgentTaskStatusResponseDTO;

import java.util.UUID;

public interface AgentTaskService {
    UUID createAgentTask(AgentTaskCreateDTO createDTO);
    AgentTaskStatusResponseDTO getAgentTaskStatus(UUID taskId);
    AgentTaskResponseDTO getPendingTask(String token);
    void submitTaskResult(UUID taskId, String token, AgentTaskResultSubmitDTO resultDTO);
    String getOrCreateAgentToken(Long projectId);
    void handleTimeoutTasks();
    
    String regenerateAgentToken(Long projectId);
}
