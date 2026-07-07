package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.code.GitHubPushEventHandler;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.example.backend.repository.AuditLogRepository;
import org.example.backend.entity.AuditLog;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubPushEventHandlerImpl implements GitHubPushEventHandler {

    private final GitHubEvidenceService evidenceService;
    private final AuditLogRepository auditLogRepository;

    @Override
    public void handlePushEvent(Map<String, Object> payload, GitHubIntegration integration) {
        String branchName = branchFromRef(payload.get("ref"));
        Map<String, Object> pusher = (Map<String, Object>) payload.get("pusher");
        String pusherName = pusher != null ? (String) pusher.get("name") : "GitHub User";

        for (Object item : list(payload.get("commits"))) {
            if (item instanceof Map<?, ?> commit) {
                evidenceService.upsertCommit(integration, (Map<String, Object>) commit, branchName);
                
                String message = (String) ((Map<String, Object>) commit).get("message");
                String shortMsg = message != null ? message.split("\n")[0] : "No message";
                if (shortMsg.length() > 60) shortMsg = shortMsg.substring(0, 60) + "...";
                
                AuditLog log = AuditLog.builder()
                        .projectId(integration.getProject().getId())
                        .username(pusherName)
                        .action("[GITHUB PUSH] " + shortMsg)
                        .status("SUCCESS")
                        .build();
                auditLogRepository.save(log);
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
