package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.code.GitHubPushEventHandler;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubPushEventHandlerImpl implements GitHubPushEventHandler {

    private final GitHubEvidenceService evidenceService;

    @Override
    public void handlePushEvent(Map<String, Object> payload, GitHubIntegration integration) {
        String branchName = branchFromRef(payload.get("ref"));
        for (Object item : list(payload.get("commits"))) {
            if (item instanceof Map<?, ?> commit) {
                evidenceService.upsertCommit(integration, (Map<String, Object>) commit, branchName);
            }
        }
    }

    private String branchFromRef(Object refValue) {
        if (refValue == null) return null;
        String ref = refValue.toString();
        String prefix = "refs/heads/";
        return ref.startsWith(prefix) ? ref.substring(prefix.length()) : ref;
    }

    private List<?> list(Object value) {
        return value instanceof List<?> list ? list : List.of();
    }
}
