package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AgentTaskResponseDTO;
import org.example.backend.dto.AgentTaskResultSubmitDTO;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.service.AgentTaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ApiAgentTaskController {

    private final AgentTaskService agentTaskService;
    private final ProjectMemberRepository projectMemberRepository;

    @GetMapping("/agent-tasks/pending")
    public ResponseEntity<AgentTaskResponseDTO> getPendingTask(@RequestParam String token) {
        AgentTaskResponseDTO task = agentTaskService.getPendingTask(token);
        if (task == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(task);
    }

    @PostMapping("/agent-tasks/{taskId}/result")
    public ResponseEntity<Void> submitTaskResult(
            @PathVariable UUID taskId,
            @RequestParam String token,
            @RequestBody AgentTaskResultSubmitDTO resultDTO) {
        agentTaskService.submitTaskResult(taskId, token, resultDTO);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/projects/{projectId}/agent-token")
    public ResponseEntity<?> getAgentToken(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new ForbiddenException("Authentication required");
        }
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isEmpty()) {
            throw new ForbiddenException("You are not a member of this project");
        }
        String token = agentTaskService.getOrCreateAgentToken(projectId);
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/projects/{projectId}/agent-token/regenerate")
    public ResponseEntity<?> regenerateAgentToken(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new ForbiddenException("Authentication required");
        }
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isEmpty()) {
            throw new ForbiddenException("You are not a member of this project");
        }
        String token = agentTaskService.regenerateAgentToken(projectId);
        return ResponseEntity.ok(Map.of("token", token));
    }
}
