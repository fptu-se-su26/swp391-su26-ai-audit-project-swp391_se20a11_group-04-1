package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.code.GitHubWorkflowRunEventHandler;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.example.backend.repository.AuditLogRepository;
import org.example.backend.entity.AuditLog;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubWorkflowRunEventHandlerImpl implements GitHubWorkflowRunEventHandler {

    private final GitHubEvidenceService evidenceService;
    private final AuditLogRepository auditLogRepository;

    @Override
    public void handleWorkflowRunEvent(Map<String, Object> payload, GitHubIntegration integration) {
        Object workflowRun = payload.get("workflow_run");
        if (workflowRun instanceof Map<?, ?> map) {
            evidenceService.upsertWorkflowRun(integration, (Map<String, Object>) map);
            
            String name = (String) map.get("name");
            String status = (String) map.get("status");
            String conclusion = (String) map.get("conclusion");
            
            Map<String, Object> actor = (Map<String, Object>) map.get("actor");
            String username = actor != null ? (String) actor.get("login") : "GitHub System";
            
            String state = conclusion != null ? conclusion : status;
            
            AuditLog log = AuditLog.builder()
                    .projectId(integration.getProject().getId())
                    .username(username)
                    .action(String.format("[GITHUB WORKFLOW] %s: %s", name, state != null ? state.toUpperCase() : "RUNNING"))
                    .status("SUCCESS")
                    .build();
            auditLogRepository.save(log);
        }
    }
}
