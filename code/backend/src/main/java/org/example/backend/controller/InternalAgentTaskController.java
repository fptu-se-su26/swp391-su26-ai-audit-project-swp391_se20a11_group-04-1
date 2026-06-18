package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AgentTaskCreateDTO;
import org.example.backend.dto.AgentTaskStatusResponseDTO;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.security.InternalServiceKeyValidator;
import org.example.backend.service.AgentTaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal/agent-tasks")
@RequiredArgsConstructor
public class InternalAgentTaskController {

    private final AgentTaskService agentTaskService;
    private final InternalServiceKeyValidator keyValidator;

    private void validateInternalKey(String key) {
        if (!keyValidator.isValid(key)) {
            throw new ForbiddenException("Invalid internal service key");
        }
    }

    @PostMapping
    public ResponseEntity<?> createAgentTask(
            @RequestHeader("X-Internal-Service-Key") String internalKey,
            @RequestBody AgentTaskCreateDTO createDTO) {
        validateInternalKey(internalKey);
        UUID taskId = agentTaskService.createAgentTask(createDTO);
        return ResponseEntity.ok(Map.of("agentTaskId", taskId));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<AgentTaskStatusResponseDTO> getAgentTaskStatus(
            @RequestHeader("X-Internal-Service-Key") String internalKey,
            @PathVariable UUID id) {
        validateInternalKey(internalKey);
        AgentTaskStatusResponseDTO status = agentTaskService.getAgentTaskStatus(id);
        return ResponseEntity.ok(status);
    }
}
