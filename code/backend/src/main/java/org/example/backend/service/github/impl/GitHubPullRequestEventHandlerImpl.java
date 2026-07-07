package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.code .GitHubPullRequestEventHandler;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.example.backend.repository.AuditLogRepository;
import org.example.backend.entity.AuditLog;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubPullRequestEventHandlerImpl implements GitHubPullRequestEventHandler {

    private final GitHubEvidenceService evidenceService;
    private final AuditLogRepository auditLogRepository;

    @Override
    public void handlePullRequestEvent(Map<String, Object> payload, GitHubIntegration integration) {
        Object pullRequest = payload.get("pull_request");
        if (pullRequest instanceof Map<?, ?> map) {
            evidenceService.upsertPullRequest(integration, (Map<String, Object>) map);
            
            String action = (String) payload.get("action");
            String title = (String) map.get("title");
            Map<String, Object> user = (Map<String, Object>) map.get("user");
            String username = user != null ? (String) user.get("login") : "GitHub User";
            
            if (title != null && title.length() > 50) title = title.substring(0, 50) + "...";
            
            AuditLog log = AuditLog.builder()
                    .projectId(integration.getProject().getId())
                    .username(username)
                    .action(String.format("[GITHUB PR %s] %s", action != null ? action.toUpperCase() : "UPDATED", title != null ? title : "No title"))
                    .status("SUCCESS")
                    .build();
            auditLogRepository.save(log);
        }
    }
}
