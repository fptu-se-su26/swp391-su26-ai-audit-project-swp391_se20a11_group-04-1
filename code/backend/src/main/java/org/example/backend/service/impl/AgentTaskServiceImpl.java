package org.example.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.AgentTaskCreateDTO;
import org.example.backend.dto.AgentTaskResponseDTO;
import org.example.backend.dto.AgentTaskResultSubmitDTO;
import org.example.backend.dto.AgentTaskStatusResponseDTO;
import org.example.backend.entity.AgentTask;
import org.example.backend.entity.Project;
import org.example.backend.entity.enums.AgentTaskStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AgentTaskRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.service.AgentTaskService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentTaskServiceImpl implements AgentTaskService {

    private final AgentTaskRepository agentTaskRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Value("${app.playwright.public-ws-url:ws://localhost:4001}")
    private String publicWsUrl;

    // ── BUG 1 FIX: dùng builder() chữ thường (Lombok convention) ──

    @Override
    @Transactional
    public UUID createAgentTask(AgentTaskCreateDTO createDTO) {
        Project project = projectRepository.findById(createDTO.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        AgentTask task = AgentTask.builder()
                .testRunId(createDTO.getTestRunId())
                .executionId(createDTO.getExecutionId())
                .project(project)
                .script(createDTO.getScript())
                .baseUrl(createDTO.getBaseUrl())
                .status(AgentTaskStatus.PENDING)
                .build();

        task = agentTaskRepository.save(task);
        return task.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public AgentTaskStatusResponseDTO getAgentTaskStatus(UUID taskId) {
        AgentTask task = agentTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("AgentTask not found"));

        com.fasterxml.jackson.databind.JsonNode resultNode = null;
        if (task.getResult() != null) {
            try {
                resultNode = objectMapper.readTree(task.getResult());
            } catch (JsonProcessingException e) {
                log.error("Failed to parse agent task result JSON", e);
            }
        }

        return AgentTaskStatusResponseDTO.builder()
                .status(task.getStatus())
                .result(resultNode)
                .build();
    }

    @Override
    @Transactional
    public AgentTaskResponseDTO getPendingTask(String token) {
        Project project = authenticateToken(token);

        AgentTask task = agentTaskRepository.findFirstByProjectIdAndStatusOrderByCreatedAtAsc(project.getId(), AgentTaskStatus.PENDING)
                .orElse(null);

        if (task == null) {
            return null;
        }

        task.setStatus(AgentTaskStatus.CLAIMED);
        task.setClaimedAt(LocalDateTime.now());
        agentTaskRepository.save(task);

        return AgentTaskResponseDTO.builder()
                .taskId(task.getId())
                .testRunId(task.getTestRunId())
                .executionId(task.getExecutionId())
                .script(task.getScript())
                .baseUrl(task.getBaseUrl())
                .wsUrl(publicWsUrl)
                .runId(task.getTestRunId() + "-" + task.getExecutionId())
                .build();
    }

    // ── Issue 7 FIX: reject submit nếu task đã TIMEOUT ──

    @Override
    @Transactional
    public void submitTaskResult(UUID taskId, String token, AgentTaskResultSubmitDTO resultDTO) {
        Project project = authenticateToken(token);

        AgentTask task = agentTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("AgentTask not found"));

        if (!task.getProject().getId().equals(project.getId())) {
            throw new IllegalArgumentException("Task does not belong to the token's project");
        }

        if (task.getStatus() == AgentTaskStatus.TIMEOUT) {
            throw new IllegalStateException("Task already timed out, result rejected");
        }

        if (task.getStatus() != AgentTaskStatus.CLAIMED) {
            log.warn("AgentTask {} is being submitted but its status is {}", taskId, task.getStatus());
        }

        task.setStatus(AgentTaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());

        try {
            task.setResult(objectMapper.writeValueAsString(resultDTO));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize agent task result", e);
        }

        agentTaskRepository.save(task);
    }

    // ── BUG 2 FIX: lưu plain text token, trả lại token nếu đã tồn tại ──
    // BCrypt one-way hash khiến không thể trả lại token ở lần gọi thứ 2.
    // Agent token không phải user password — chấp nhận lưu plain text.

    @Override
    @Transactional
    public String getOrCreateAgentToken(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (project.getAgentToken() != null) {
            // Token đã tồn tại → trả lại trực tiếp (plain text)
            return project.getAgentToken();
        }

        String rawToken = "dta_" + projectId + "_" + UUID.randomUUID().toString().replace("-", "");
        project.setAgentToken(rawToken);
        projectRepository.save(project);

        return rawToken;
    }

    @Override
    @Transactional
    public void handleTimeoutTasks() {
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);

        List<AgentTask> claimedTasks = agentTaskRepository.findByStatusAndClaimedAtBefore(AgentTaskStatus.CLAIMED, fiveMinutesAgo);
        for (AgentTask task : claimedTasks) {
            task.setStatus(AgentTaskStatus.TIMEOUT);
            task.setCompletedAt(LocalDateTime.now());
        }
        agentTaskRepository.saveAll(claimedTasks);

        List<AgentTask> pendingTasks = agentTaskRepository.findByStatusAndCreatedAtBefore(AgentTaskStatus.PENDING, fiveMinutesAgo);
        for (AgentTask task : pendingTasks) {
            task.setStatus(AgentTaskStatus.TIMEOUT);
            task.setCompletedAt(LocalDateTime.now());
        }
        agentTaskRepository.saveAll(pendingTasks);
    }

    // ── Issue 6 FIX: bỏ BCrypt, dùng plain text equals ──

    private Project authenticateToken(String token) {
        if (token == null || !token.startsWith("dta_")) {
            throw new IllegalArgumentException("Invalid token format");
        }

        String[] parts = token.split("_", 3);
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid token format");
        }

        Long projectId;
        try {
            projectId = Long.parseLong(parts[1]);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid token project ID");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (project.getAgentToken() == null || !project.getAgentToken().equals(token)) {
            throw new IllegalArgumentException("Invalid agent token");
        }

        return project;
    }
}
