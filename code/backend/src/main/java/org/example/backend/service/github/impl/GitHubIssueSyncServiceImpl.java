package org.example.backend.service.github.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.BugReport;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.Priority;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskChecklist;
import org.example.backend.entity.TaskStatus;
import org.example.backend.entity.TaskType;
import org.example.backend.entity.UserGithubToken;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.BugReportRepository;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.UserGithubTokenRepository;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.example.backend.service.github.issue.GitHubIssueSyncService;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GitHubIssueSyncServiceImpl implements GitHubIssueSyncService {

    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final UserGithubTokenRepository userGithubTokenRepository;
    private final BugReportRepository bugReportRepository;
    private final TaskRepository taskRepository;
    private final ObjectMapper objectMapper;
    private final GitHubIntegrationService integrationService;
    private final RestTemplate restTemplate = new RestTemplate(new org.springframework.http.client.JdkClientHttpRequestFactory());

    @Override
    public void createGitHubIssue(BugReport bugReport, Long userId) {
        Long projectId = bugReport.getProject().getId();
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CustomException("GitHub integration not found for this project", HttpStatus.BAD_REQUEST));

        UserGithubToken userToken = findIntegrationOwnerToken(integration);
        String accessToken = integrationService.decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/issues",
                integration.getRepoOwner(), integration.getRepoName());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("title", String.format("[BUG] %s", bugReport.getTitle()));
        requestBody.put("body", formatIssueBody(bugReport));
        requestBody.put("labels", Collections.singletonList("bug"));

        try {
            log.info("Creating GitHub issue on repo: {}/{}", integration.getRepoOwner(), integration.getRepoName());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(requestBody, createGitHubHeaders(accessToken)), Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Integer issueNumber = (Integer) response.getBody().get("number");
                String issueUrl = (String) response.getBody().get("html_url");
                log.info("GitHub Issue #{} created successfully: {}", issueNumber, issueUrl);
                saveGitHubMetadata(bugReport, issueNumber, issueUrl);
                if (bugReport.getRelatedTask() != null) {
                    Task task = bugReport.getRelatedTask();
                    task.setGithubIssueNumber(issueNumber);
                    task.setGithubIssueUrl(issueUrl);
                    taskRepository.save(task);
                    log.info("Saved GitHub Issue #{} metadata to related Task ID: {}", issueNumber, task.getId());
                }
                return;
            }
            throw new CustomException("Failed to create GitHub issue: Unexpected response status", HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating GitHub issue: ", e);
            throw new CustomException("Failed to synchronize with GitHub API: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void createGitHubIssueForTask(Task task, Long userId) {
        Long projectId = task.getProject().getId();
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId).orElse(null);
        if (integration == null) {
            log.warn("Skipping GitHub sync for Task ID: {}. No integration found for project {}", task.getId(), projectId);
            return;
        }

        UserGithubToken userToken = userGithubTokenRepository.findById(integration.getConnectedBy().getId()).orElse(null);
        if (userToken == null) {
            log.warn("Skipping GitHub sync for Task ID: {}. Project Leader's GitHub token is missing.", task.getId());
            return;
        }

        String accessToken = integrationService.decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/issues",
                integration.getRepoOwner(), integration.getRepoName());

        String label = switch (task.getType()) {
            case TESTING -> "testing";
            case BUG_FIX -> "bug";
            default -> "enhancement";
        };
        String issueTitle = task.getParent() != null ? String.format("[Sub-task] %s", task.getTitle()) : task.getTitle();
        List<String> labels = new ArrayList<>();
        labels.add(label);
        if (task.getParent() != null) {
            labels.add("sub-task");
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("title", issueTitle);
        requestBody.put("body", buildTaskIssueBody(task));
        requestBody.put("labels", labels);

        try {
            log.info("Creating GitHub issue for Task ID: {} on repo: {}/{}", task.getId(), integration.getRepoOwner(), integration.getRepoName());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(requestBody, createGitHubHeaders(accessToken)), Map.class);
            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Integer issueNumber = (Integer) response.getBody().get("number");
                String issueUrl = (String) response.getBody().get("html_url");
                task.setGithubIssueNumber(issueNumber);
                task.setGithubIssueUrl(issueUrl);
                taskRepository.save(task);
                log.info("GitHub Issue #{} created for Task ID: {}", issueNumber, task.getId());

                if (task.getParent() != null) {
                    updateParentGitHubIssueBody(task.getParent(), accessToken, integration);
                }
            }
        } catch (Exception e) {
            log.error("Failed to create GitHub issue for Task ID: {}: ", task.getId(), e);
        }
    }

    @Override
    public void updateGitHubIssueStatus(BugReport bugReport, Long userId) {
        Long projectId = bugReport.getProject().getId();
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId).orElse(null);
        if (integration == null) {
            log.warn("Skipping GitHub status sync. No integration found for project ID: {}", projectId);
            return;
        }

        Integer issueNumber = getGitHubIssueNumber(bugReport);
        if (issueNumber == null) {
            log.warn("Skipping GitHub status sync. No issue number found for Bug Report ID: {}", bugReport.getId());
            return;
        }

        UserGithubToken userToken = userGithubTokenRepository.findById(integration.getConnectedBy().getId()).orElse(null);
        if (userToken == null) {
            log.warn("Skipping GitHub status sync. The Project Leader's GitHub token is missing.");
            return;
        }

        String accessToken = integrationService.decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/issues/%d",
                integration.getRepoOwner(), integration.getRepoName(), issueNumber);
        String state = (bugReport.getStatus() == BugStatus.CLOSED || bugReport.getStatus() == BugStatus.FIXED) ? "closed" : "open";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("state", state);

        try {
            log.info("Updating GitHub issue #{} state to: {}", issueNumber, state);
            restTemplate.exchange(url, HttpMethod.PATCH, new HttpEntity<>(requestBody, createGitHubHeaders(accessToken)), Map.class);
            log.info("GitHub issue #{} state updated successfully", issueNumber);
        } catch (Exception e) {
            log.error("Failed to sync status to GitHub issue #{}: ", issueNumber, e);
        }
    }

    @Override
    public void updateGitHubIssueStatusForTask(Task task, Long userId) {
        if (task.getGithubIssueNumber() == null) {
            log.info("Task ID: {} has no GitHub issue number stored. Auto-creating issue on GitHub.", task.getId());
            createGitHubIssueForTask(task, userId);
            return;
        }

        Long projectId = task.getProject().getId();
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId).orElse(null);
        if (integration == null) {
            log.warn("Skipping GitHub status sync for Task ID: {}. No integration found.", task.getId());
            return;
        }

        UserGithubToken userToken = userGithubTokenRepository.findById(integration.getConnectedBy().getId()).orElse(null);
        if (userToken == null) {
            log.warn("Skipping GitHub status sync for Task ID: {}. Project Leader token missing.", task.getId());
            return;
        }

        String accessToken = integrationService.decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/issues/%d",
                integration.getRepoOwner(), integration.getRepoName(), task.getGithubIssueNumber());
        String state = task.getStatus() == TaskStatus.DONE ? "closed" : "open";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("state", state);
        requestBody.put("body", buildTaskIssueBody(task));

        try {
            log.info("Updating GitHub issue #{} for Task ID: {} to state: {}", task.getGithubIssueNumber(), task.getId(), state);
            restTemplate.exchange(url, HttpMethod.PATCH, new HttpEntity<>(requestBody, createGitHubHeaders(accessToken)), Map.class);
            log.info("GitHub issue #{} updated successfully.", task.getGithubIssueNumber());

            if (task.getParent() != null) {
                updateParentGitHubIssueBody(task.getParent(), accessToken, integration);
            }
        } catch (Exception e) {
            log.error("Failed to sync GitHub issue status for Task ID: {}: ", task.getId(), e);
        }
    }

    private UserGithubToken findIntegrationOwnerToken(GitHubIntegration integration) {
        return userGithubTokenRepository.findById(integration.getConnectedBy().getId())
                .orElseThrow(() -> new CustomException("The Project Leader's GitHub connection is broken or missing.", HttpStatus.BAD_REQUEST));
    }

    private String buildTaskIssueBody(Task task) {
        StringBuilder body = new StringBuilder();
        body.append("### Task Details\n");
        body.append(String.format("**Type**: %s\n", task.getType()));
        body.append(String.format("**Priority**: %s\n", task.getPriority()));
        if (task.getParent() != null) {
            Integer parentNum = task.getParent().getGithubIssueNumber();
            body.append(String.format("**Parent Task**: %s\n", parentNum != null ? "#" + parentNum : task.getParent().getTitle()));
        }
        if (task.getDeadline() != null) {
            body.append(String.format("**Deadline**: %s\n", task.getDeadline()));
        }
        if (task.getDescription() != null && !task.getDescription().isBlank()) {
            body.append("\n### Description\n").append(task.getDescription()).append("\n");
        }
        if (task.getChecklist() != null && !task.getChecklist().isEmpty()) {
            body.append("\n### Checklist\n");
            task.getChecklist().forEach(item ->
                    body.append(item.isDone() ? "- [x] " : "- [ ] ").append(item.getContent()).append("\n"));
        }

        List<Task> subTasks = taskRepository.findByParentId(task.getId());
        if (subTasks != null && !subTasks.isEmpty()) {
            body.append("\n### Sub-tasks\n");
            for (Task sub : subTasks) {
                String check = sub.getStatus() == TaskStatus.DONE ? "- [x] " : "- [ ] ";
                if (sub.getGithubIssueNumber() != null) {
                    body.append(check).append("#").append(sub.getGithubIssueNumber()).append("\n");
                } else {
                    body.append(check).append(sub.getTitle()).append(" (Pending Sync)\n");
                }
            }
        }

        body.append("\n\n<!-- devtrack-task-id: ").append(task.getId()).append(" -->\n");
        return body.toString();
    }

    private void updateParentGitHubIssueBody(Task parentTask, String accessToken, GitHubIntegration integration) {
        if (parentTask.getGithubIssueNumber() == null) {
            log.warn("Cannot update parent issue body: parent task has no GitHub issue number stored.");
            return;
        }

        String parentUrl = String.format("https://api.github.com/repos/%s/%s/issues/%d",
                integration.getRepoOwner(), integration.getRepoName(), parentTask.getGithubIssueNumber());
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("body", buildTaskIssueBody(parentTask));

        try {
            log.info("Updating parent GitHub issue #{} body", parentTask.getGithubIssueNumber());
            restTemplate.exchange(parentUrl, HttpMethod.PATCH, new HttpEntity<>(requestBody, createGitHubHeaders(accessToken)), Map.class);
            log.info("Parent GitHub issue #{} body updated successfully", parentTask.getGithubIssueNumber());
        } catch (Exception e) {
            log.error("Failed to update parent GitHub issue #{} body: ", parentTask.getGithubIssueNumber(), e);
        }
    }

    private String formatIssueBody(BugReport bug) {
        StringBuilder sb = new StringBuilder();
        sb.append("### Description\n").append(bug.getDescription() != null ? bug.getDescription() : "No description provided.").append("\n\n");

        if (bug.getStepsToReproduce() != null) {
            try {
                Map<String, Object> meta = objectMapper.readValue(bug.getStepsToReproduce(), Map.class);
                if (meta.containsKey("steps")) {
                    sb.append("### Steps to Reproduce\n").append(meta.get("steps")).append("\n\n");
                }
            } catch (Exception e) {
                sb.append("### Steps to Reproduce\n").append(bug.getStepsToReproduce()).append("\n\n");
            }
        }

        sb.append("### Technical Details\n");
        sb.append("- **Severity:** ").append(bug.getSeverity() != null ? bug.getSeverity().name() : "N/A").append("\n");
        sb.append("- **Environment:** ").append(bug.getEnvironment() != null ? bug.getEnvironment().name() : "N/A").append("\n");
        sb.append("- **Reporter:** ").append(bug.getCreatedBy() != null ? bug.getCreatedBy().getUsername() : "System").append("\n\n");

        if (bug.getRelatedTask() != null && bug.getRelatedTask().getChecklist() != null && !bug.getRelatedTask().getChecklist().isEmpty()) {
            sb.append("### Checklist\n");
            for (TaskChecklist item : bug.getRelatedTask().getChecklist()) {
                sb.append(item.isDone() ? "- [x] " : "- [ ] ").append(item.getContent()).append("\n");
            }
            sb.append("\n");
        }

        sb.append("\n<!-- devtrack-bug-id: ").append(bug.getId()).append(" -->\n");
        sb.append("> *Sync generated automatically by DevTrack AI module.*");
        return sb.toString();
    }

    public void saveGitHubMetadata(BugReport bug, Integer issueNumber, String issueUrl) {
        try {
            Map<String, Object> meta = new HashMap<>();
            if (bug.getStepsToReproduce() != null) {
                try {
                    meta = objectMapper.readValue(bug.getStepsToReproduce(), Map.class);
                } catch (Exception ignored) {
                    meta.put("steps", bug.getStepsToReproduce());
                }
            }
            meta.put("github_issue_number", issueNumber);
            meta.put("github_issue_url", issueUrl);

            bug.setStepsToReproduce(objectMapper.writeValueAsString(meta));
            bugReportRepository.save(bug);
        } catch (Exception e) {
            log.error("Failed to save GitHub metadata to steps_to_reproduce: ", e);
        }
    }

    public Integer getGitHubIssueNumber(BugReport bug) {
        if (bug.getStepsToReproduce() == null) return null;
        try {
            Map<String, Object> meta = objectMapper.readValue(bug.getStepsToReproduce(), Map.class);
            Object number = meta.get("github_issue_number");
            return number instanceof Number ? ((Number) number).intValue() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private HttpHeaders createGitHubHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.valueOf("application/vnd.github+json")));
        headers.set("Authorization", "Bearer " + token);
        headers.set("User-Agent", "DevTrack-AI");
        return headers;
    }
}
