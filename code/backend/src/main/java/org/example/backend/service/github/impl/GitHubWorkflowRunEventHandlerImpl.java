package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.code.GitHubWorkflowRunEventHandler;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubWorkflowRunEventHandlerImpl implements GitHubWorkflowRunEventHandler {

    private final GitHubEvidenceService evidenceService;

    @Override
    public void handleWorkflowRunEvent(Map<String, Object> payload, GitHubIntegration integration) {
        Object workflowRun = payload.get("workflow_run");
        if (workflowRun instanceof Map<?, ?> map) {
            evidenceService.upsertWorkflowRun(integration, (Map<String, Object>) map);
        }
    }
}
