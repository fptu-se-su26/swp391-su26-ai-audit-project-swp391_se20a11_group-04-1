package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.repository.GitHubPullRequestFileRepository;
import org.example.backend.repository.GitHubPullRequestRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.CodeInsightPatchService;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeInsightPatchServiceImpl implements CodeInsightPatchService {

    private static final int MAX_FILES = 20;
    private static final int MAX_PATCH_CHARS = 8000;

    private final TaskRepository taskRepository;
    private final GitHubIntegrationRepository integrationRepository;
    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final GitHubPullRequestRepository pullRequestRepository;
    private final GitHubPullRequestFileRepository fileRepository;
    private final GitHubIntegrationService integrationService;
    private final RestTemplate restTemplate = new RestTemplate(new org.springframework.http.client.JdkClientHttpRequestFactory());

    @Override
    @Transactional
    public void fetchChangedFiles(Long projectId, Long taskId, Long userId) {
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
        if (task.getProject() == null || !projectId.equals(task.getProject().getId())) {
            throw new CustomException("Task does not belong to this project", HttpStatus.BAD_REQUEST);
        }

        GitHubIntegration integration = integrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CustomException("GitHub integration is not configured", HttpStatus.BAD_REQUEST));
        String token = integrationService.getDecryptedUserToken(userId);

        List<Long> prIds = evidenceLinkRepository.findByTaskId(taskId).stream()
                .filter(link -> link.getEvidenceType() == CodeInsightEvidenceType.PULL_REQUEST)
                .map(CodeInsightEvidenceLink::getEvidenceId)
                .distinct()
                .toList();
        if (prIds.isEmpty()) return;

        for (GitHubPullRequest pullRequest : pullRequestRepository.findAllById(prIds)) {
            fetchPullRequestFiles(integration, token, pullRequest);
        }
    }

    private void fetchPullRequestFiles(GitHubIntegration integration, String token, GitHubPullRequest pullRequest) {
        String url = "https://api.github.com/repos/" + integration.getRepoOwner() + "/" + integration.getRepoName()
                + "/pulls/" + pullRequest.getPrNumber() + "/files?per_page=100";
        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers(token)), List.class);
            List<?> rows = response.getBody() != null ? response.getBody() : List.of();
            int saved = 0;
            for (Object row : rows) {
                if (!(row instanceof Map<?, ?> file) || saved >= MAX_FILES) continue;
                String path = text(file.get("filename"));
                if (!hasText(path) || shouldIgnore(path)) continue;
                upsertFile(pullRequest, file, path);
                saved++;
            }
        } catch (CustomException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Failed to fetch GitHub PR files for PR {}: {}", pullRequest.getPrNumber(), ex.getMessage());
            throw new CustomException("Failed to fetch pull request files from GitHub", HttpStatus.BAD_REQUEST);
        }
    }

    private void upsertFile(GitHubPullRequest pullRequest, Map<?, ?> file, String path) {
        GitHubPullRequestFile entity = fileRepository.findByPullRequestIdAndFilePath(pullRequest.getId(), path)
                .orElseGet(() -> GitHubPullRequestFile.builder()
                        .pullRequest(pullRequest)
                        .filePath(path)
                        .build());
        String patch = truncate(text(file.get("patch")), MAX_PATCH_CHARS);
        entity.setStatus(text(file.get("status")));
        entity.setAdditions(number(file.get("additions")));
        entity.setDeletions(number(file.get("deletions")));
        entity.setChanges(number(file.get("changes")));
        entity.setPatchHash(hasText(patch) ? sha256(patch) : null);
        entity.setPatchSummary(summarizePatch(patch));
        entity.setFetchedAt(LocalDateTime.now());
        fileRepository.save(entity);
    }

    private HttpHeaders headers(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Accept", "application/vnd.github+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }

    private boolean shouldIgnore(String path) {
        String lower = path.toLowerCase();
        return lower.contains("/node_modules/")
                || lower.startsWith("node_modules/")
                || lower.contains("/dist/")
                || lower.startsWith("dist/")
                || lower.contains("/build/")
                || lower.startsWith("build/")
                || lower.contains("/target/")
                || lower.startsWith("target/")
                || lower.endsWith(".lock")
                || lower.endsWith("package-lock.json")
                || lower.endsWith("yarn.lock")
                || lower.endsWith(".png")
                || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".gif")
                || lower.endsWith(".pdf");
    }

    private String summarizePatch(String patch) {
        if (!hasText(patch)) return null;
        return truncate(redactSecrets(patch).replaceAll("\\s+", " ").trim(), 500);
    }

    private String redactSecrets(String value) {
        return value
                .replaceAll("(?i)(token|secret|password|api[_-]?key)\\s*[:=]\\s*[^\\s]+", "$1=[REDACTED]")
                .replaceAll("ghp_[A-Za-z0-9_]{20,}", "[REDACTED_GITHUB_TOKEN]")
                .replaceAll("sk-[A-Za-z0-9]{20,}", "[REDACTED_API_KEY]");
    }

    private int number(Object value) {
        if (value instanceof Number n) return n.intValue();
        try {
            return value != null ? Integer.parseInt(value.toString()) : 0;
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private String truncate(String value, int max) {
        if (value == null || value.length() <= max) return value;
        return value.substring(0, max);
    }

    private String text(Object value) {
        return value != null ? value.toString() : null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
