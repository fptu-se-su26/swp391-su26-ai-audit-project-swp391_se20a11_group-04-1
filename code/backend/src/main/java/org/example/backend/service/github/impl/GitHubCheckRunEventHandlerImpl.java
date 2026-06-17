package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.code.GitHubCheckRunEventHandler;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubCheckRunEventHandlerImpl implements GitHubCheckRunEventHandler {

    private final GitHubEvidenceService evidenceService;

    @Override
    public void handleCheckRunEvent(Map<String, Object> payload, GitHubIntegration integration) {
        Object checkRun = payload.get("check_run");
        if (checkRun instanceof Map<?, ?> map) {
            evidenceService.upsertCheckRun(integration, (Map<String, Object>) map);
        }
    }
}
