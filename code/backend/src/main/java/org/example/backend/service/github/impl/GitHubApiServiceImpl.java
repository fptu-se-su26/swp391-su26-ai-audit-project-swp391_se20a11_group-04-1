package org.example.backend.service.github.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.entity.enums.BugSeverity;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.entity.enums.Environment;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.EncryptionService;
import org.example.backend.service.github.GitHubApiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Implementation of GitHubApiService using RestTemplate for GitHub REST API communications
 * and handling secure incoming webhooks for two-way synchronization.
 */
@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GitHubApiServiceImpl implements GitHubApiService {

    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final BugReportRepository bugReportRepository;
    private final ProjectRepository projectRepository;
    private final UserAccountRepository userAccountRepository;
    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserGithubTokenRepository userGithubTokenRepository;
    private final ObjectMapper objectMapper;
    private final EncryptionService encryptionService;
    private final RestTemplate restTemplate = new RestTemplate(new org.springframework.http.client.JdkClientHttpRequestFactory());

    @Value("${github.client-id}")
    private String clientId;

    @Value("${github.client-secret}")
    private String clientSecret;

    @Value("${github.redirect-uri}")
    private String redirectUri;

    @Override
    public void createGitHubIssue(BugReport bugReport, Long userId) {
        Long projectId = bugReport.getProject().getId();
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CustomException("GitHub integration not found for this project", HttpStatus.BAD_REQUEST));

        // CHUYỂN ĐỔI QUAN TRỌNG: Lấy Token của người đã kết nối (Project Leader) thay vì token của người đang thao tác
        Long integrationOwnerId = integration.getConnectedBy().getId();
        UserGithubToken userToken = userGithubTokenRepository.findById(integrationOwnerId)
                .orElseThrow(() -> new CustomException("The Project Leader's GitHub connection is broken or missing.", HttpStatus.BAD_REQUEST));

        String accessToken = decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/issues",
                integration.getRepoOwner(), integration.getRepoName());

        // Format issue title & body with description, metadata, and task checklist
        String issueTitle = String.format("[BUG] %s", bugReport.getTitle());
        String issueBody = formatIssueBody(bugReport);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("title", issueTitle);
        requestBody.put("body", issueBody);
        requestBody.put("labels", Collections.singletonList("bug"));

        HttpHeaders headers = createGitHubHeaders(accessToken);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Creating GitHub issue on repo: {}/{}", integration.getRepoOwner(), integration.getRepoName());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Integer issueNumber = (Integer) body.get("number");
                String issueUrl = (String) body.get("html_url");

                log.info("GitHub Issue #{} created successfully: {}", issueNumber, issueUrl);

                // Store issue metadata in the steps_to_reproduce JSONB column of BugReport
                saveGitHubMetadata(bugReport, issueNumber, issueUrl);

                // Sync metadata to the associated Task entity
                if (bugReport.getRelatedTask() != null) {
                    Task t = bugReport.getRelatedTask();
                    t.setGithubIssueNumber(issueNumber);
                    t.setGithubIssueUrl(issueUrl);
                    taskRepository.save(t);
                    log.info("Saved GitHub Issue #{} metadata to related Task ID: {}", issueNumber, t.getId());
                }
            } else {
                throw new CustomException("Failed to create GitHub issue: Unexpected response status", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (Exception e) {
            log.error("Error creating GitHub issue: ", e);
            throw new CustomException("Failed to synchronize with GitHub API: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String extractUserDescription(String fullBody) {
        if (fullBody == null) return null;
        int descIdx = fullBody.indexOf("### 📝 Description");
        if (descIdx == -1) {
            return fullBody;
        }

        int startIdx = descIdx + "### 📝 Description".length();
        while (startIdx < fullBody.length() && (fullBody.charAt(startIdx) == '\r' || fullBody.charAt(startIdx) == '\n')) {
            startIdx++;
        }

        int nextSectionIdx = fullBody.length();
        int checklistIdx = fullBody.indexOf("### ✅ Checklist", startIdx);
        int subtasksIdx = fullBody.indexOf("### ⛓️ Sub-tasks", startIdx);
        int footerIdx = fullBody.indexOf("> *Sync generated", startIdx);

        if (checklistIdx != -1 && checklistIdx < nextSectionIdx) {
            nextSectionIdx = checklistIdx;
        }
        if (subtasksIdx != -1 && subtasksIdx < nextSectionIdx) {
            nextSectionIdx = subtasksIdx;
        }
        if (footerIdx != -1 && footerIdx < nextSectionIdx) {
            nextSectionIdx = footerIdx;
        }

        return fullBody.substring(startIdx, nextSectionIdx).trim();
    }

    private String buildTaskIssueBody(Task task) {
        StringBuilder body = new StringBuilder();
        body.append("### 📋 Task Details\n");
        body.append(String.format("**Type**: %s\n", task.getType()));
        body.append(String.format("**Priority**: %s\n", task.getPriority()));
        if (task.getParent() != null) {
            Integer parentNum = task.getParent().getGithubIssueNumber();
            body.append(String.format("**Parent Task**: %s\n", 
                    parentNum != null ? "#" + parentNum : task.getParent().getTitle()));
        }
        if (task.getDeadline() != null) body.append(String.format("**Deadline**: %s\n", task.getDeadline()));
        if (task.getDescription() != null && !task.getDescription().isBlank()) {
            body.append("\n### 📝 Description\n").append(task.getDescription()).append("\n");
        }
        if (task.getChecklist() != null && !task.getChecklist().isEmpty()) {
            body.append("\n### ✅ Checklist\n");
            task.getChecklist().forEach(item ->
                body.append(item.isDone() ? "- [x] " : "- [ ] ").append(item.getContent()).append("\n")
            );
        }

        // Subtasks checklist section
        List<Task> subTasks = taskRepository.findByParentId(task.getId());
        if (subTasks != null && !subTasks.isEmpty()) {
            body.append("\n### ⛓️ Sub-tasks\n");
            for (Task sub : subTasks) {
                String check = (sub.getStatus() == TaskStatus.DONE) ? "- [x] " : "- [ ] ";
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

        String updatedBody = buildTaskIssueBody(parentTask);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("body", updatedBody);

        HttpHeaders headers = createGitHubHeaders(accessToken);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Updating parent GitHub issue #{} body", parentTask.getGithubIssueNumber());
            restTemplate.exchange(parentUrl, HttpMethod.PATCH, entity, Map.class);
            log.info("Parent GitHub issue #{} body updated successfully", parentTask.getGithubIssueNumber());
        } catch (Exception e) {
            log.error("Failed to update parent GitHub issue #{} body: ", parentTask.getGithubIssueNumber(), e);
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

        Long integrationOwnerId = integration.getConnectedBy().getId();
        UserGithubToken userToken = userGithubTokenRepository.findById(integrationOwnerId).orElse(null);
        if (userToken == null) {
            log.warn("Skipping GitHub sync for Task ID: {}. Project Leader's GitHub token is missing.", task.getId());
            return;
        }

        String accessToken = decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/issues",
                integration.getRepoOwner(), integration.getRepoName());

        // Determine label based on task type
        String label = switch (task.getType()) {
            case TESTING  -> "testing";
            case BUG_FIX  -> "bug";
            default       -> "enhancement";
        };

        String issueBody = buildTaskIssueBody(task);
        String issueTitle = task.getParent() != null ? String.format("[Sub-task] %s", task.getTitle()) : task.getTitle();
        List<String> labels = new ArrayList<>();
        labels.add(label);
        if (task.getParent() != null) {
            labels.add("sub-task");
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("title", issueTitle);
        requestBody.put("body", issueBody);
        requestBody.put("labels", labels);

        HttpHeaders headers = createGitHubHeaders(accessToken);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Creating GitHub issue for Task ID: {} on repo: {}/{}", task.getId(), integration.getRepoOwner(), integration.getRepoName());
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
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

        // Retrieve GitHub Issue Number from steps_to_reproduce metadata
        Integer issueNumber = getGitHubIssueNumber(bugReport);
        if (issueNumber == null) {
            log.warn("Skipping GitHub status sync. No issue number found for Bug Report ID: {}", bugReport.getId());
            return;
        }

        Long integrationOwnerId = integration.getConnectedBy().getId();
        UserGithubToken userToken = userGithubTokenRepository.findById(integrationOwnerId).orElse(null);
        if (userToken == null) {
            log.warn("Skipping GitHub status sync. The Project Leader's GitHub token is missing.");
            return;
        }

        String accessToken = decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/issues/%d",
                integration.getRepoOwner(), integration.getRepoName(), issueNumber);

        // Map BugReport status to GitHub issue state (open/closed)
        String state = (bugReport.getStatus() == BugStatus.CLOSED || bugReport.getStatus() == BugStatus.FIXED)
                ? "closed" : "open";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("state", state);

        HttpHeaders headers = createGitHubHeaders(accessToken);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Updating GitHub issue #{} state to: {}", issueNumber, state);
            restTemplate.exchange(url, HttpMethod.PATCH, entity, Map.class);
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

        Long integrationOwnerId = integration.getConnectedBy().getId();
        UserGithubToken userToken = userGithubTokenRepository.findById(integrationOwnerId).orElse(null);
        if (userToken == null) {
            log.warn("Skipping GitHub status sync for Task ID: {}. Project Leader token missing.", task.getId());
            return;
        }

        String accessToken = decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/issues/%d",
                integration.getRepoOwner(), integration.getRepoName(), task.getGithubIssueNumber());

        // DONE → closed, everything else → open
        String state = (task.getStatus() == TaskStatus.DONE) ? "closed" : "open";
        String updatedBody = buildTaskIssueBody(task);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("state", state);
        requestBody.put("body", updatedBody);

        HttpHeaders headers = createGitHubHeaders(accessToken);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Updating GitHub issue #{} for Task ID: {} to state: {}", task.getGithubIssueNumber(), task.getId(), state);
            restTemplate.exchange(url, HttpMethod.PATCH, entity, Map.class);
            log.info("GitHub issue #{} updated successfully.", task.getGithubIssueNumber());

            if (task.getParent() != null) {
                updateParentGitHubIssueBody(task.getParent(), accessToken, integration);
            }
        } catch (Exception e) {
            log.error("Failed to sync GitHub issue status for Task ID: {}: ", task.getId(), e);
        }
    }

    @Override
    public void handleWebhook(String signatureHeader, String eventType, byte[] payloadBytes) {
        String payloadBody = new String(payloadBytes, StandardCharsets.UTF_8);
        // Fast-fail: Drop irrelevant events immediately to save CPU and Database bandwidth
        if (!"issues".equalsIgnoreCase(eventType) && !"ping".equalsIgnoreCase(eventType)) {
            log.debug("Ignored unsupported GitHub webhook event: {}", eventType);
            return;
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(payloadBody, Map.class);
            Map<String, Object> repository = (Map<String, Object>) payload.get("repository");
            if (repository == null) return;

            String repoOwner = (String) ((Map<String, Object>) repository.get("owner")).get("login");
            String repoName = (String) repository.get("name");

            // 1. Fetch connection details and validate HMAC SHA-256 signature
            List<GitHubIntegration> integrations = gitHubIntegrationRepository.findAll();
            GitHubIntegration matchedIntegration = integrations.stream()
                    .filter(i -> i.getRepoOwner().equalsIgnoreCase(repoOwner) && i.getRepoName().equalsIgnoreCase(repoName))
                    .findFirst()
                    .orElse(null);

            if (matchedIntegration == null) {
                log.warn("Ignoring webhook. No matching integration found for repo: {}/{}", repoOwner, repoName);
                return;
            }

            String decryptedSecret = decryptToken(matchedIntegration.getWebhookSecretEncrypted());
            log.debug("Verifying webhook signature. Secret length: {}, Secret preview: {}",
                    decryptedSecret != null ? decryptedSecret.length() : 0,
                    decryptedSecret != null && decryptedSecret.length() > 4
                            ? decryptedSecret.substring(0, 4) + "****" : "[empty]");

            if (!isValidSignature(payloadBytes, signatureHeader, decryptedSecret)) {
                log.error("Webhook signature mismatch for repo: {}/{}. Header: {}", repoOwner, repoName,
                        signatureHeader != null ? signatureHeader.substring(0, Math.min(20, signatureHeader.length())) + "..." : "null");
                throw new CustomException("Invalid webhook signature", HttpStatus.FORBIDDEN);
            }

            // 2. Handle issue event categories
            if ("issues".equalsIgnoreCase(eventType)) {
                String action = (String) payload.get("action");
                Map<String, Object> issue = (Map<String, Object>) payload.get("issue");
                if (issue == null) return;

                Integer issueNumber = (Integer) issue.get("number");
                String issueUrl = (String) issue.get("html_url");
                String title = (String) issue.get("title");
                String bodyText = (String) issue.get("body");

                log.info("Processing webhook event: issues.{} for Issue #{}", action, issueNumber);

                BugReport bug = findBugReportByIssueNumber(matchedIntegration.getProject().getId(), issueNumber);
                Task existingTask = taskRepository.findByProjectIdOrderByUpdatedAtDesc(matchedIntegration.getProject().getId()).stream()
                        .filter(t -> t.getGithubIssueNumber() != null && t.getGithubIssueNumber().equals(issueNumber))
                        .findFirst()
                        .orElse(null);

                if ("opened".equalsIgnoreCase(action)) {
                    // Check if it is a sync issue from our system via HTML comment tags
                    Long syncBugId = null;
                    Long syncTaskId = null;
                    if (bodyText != null) {
                        java.util.regex.Matcher bugMatcher = java.util.regex.Pattern.compile("<!-- devtrack-bug-id: (\\d+) -->").matcher(bodyText);
                        if (bugMatcher.find()) {
                            syncBugId = Long.parseLong(bugMatcher.group(1));
                        }
                        java.util.regex.Matcher taskMatcher = java.util.regex.Pattern.compile("<!-- devtrack-task-id: (\\d+) -->").matcher(bodyText);
                        if (taskMatcher.find()) {
                            syncTaskId = Long.parseLong(taskMatcher.group(1));
                        }
                    }

                    // Check if the issue has "sub-task" label or starts with "[Sub-task]" in the title
                    List<Map<String, Object>> labelsList = (List<Map<String, Object>>) issue.get("labels");
                    boolean isSubTask = false;
                    if (labelsList != null) {
                        for (Map<String, Object> labelMap : labelsList) {
                            String labelName = (String) labelMap.get("name");
                            if ("sub-task".equalsIgnoreCase(labelName)) {
                                isSubTask = true;
                                break;
                            }
                        }
                    }
                    if (title != null && title.startsWith("[Sub-task]")) {
                        isSubTask = true;
                    }

                    boolean isSyncedIssue = syncBugId != null || syncTaskId != null || isSubTask;

                    if (syncBugId != null) {
                        log.info("Webhook issues.opened recognized synced Bug Report ID: {} for Issue #{}", syncBugId, issueNumber);
                        // Retry mechanism to handle database transaction isolation delays from the main thread
                        Optional<BugReport> optBug = Optional.empty();
                        for (int i = 0; i < 3; i++) {
                            optBug = bugReportRepository.findById(syncBugId);
                            if (optBug.isPresent()) break;
                            try { Thread.sleep(500); } catch (InterruptedException ignored) {}
                        }

                        if (optBug.isPresent()) {
                            BugReport b = optBug.get();
                            saveGitHubMetadata(b, issueNumber, issueUrl);
                            if (b.getRelatedTask() != null) {
                                Task t = b.getRelatedTask();
                                t.setGithubIssueNumber(issueNumber);
                                t.setGithubIssueUrl(issueUrl);
                                taskRepository.save(t);
                            }
                        } else {
                            log.warn("Synced Bug Report ID {} not found in database after retries. Ignoring webhook.", syncBugId);
                        }
                        return;
                    }

                    if (syncTaskId != null) {
                        log.info("Webhook issues.opened recognized synced Task ID: {} for Issue #{}", syncTaskId, issueNumber);
                        // Retry mechanism to handle database transaction isolation delays from the main thread
                        Optional<Task> optTask = Optional.empty();
                        for (int i = 0; i < 3; i++) {
                            optTask = taskRepository.findById(syncTaskId);
                            if (optTask.isPresent()) break;
                            try { Thread.sleep(500); } catch (InterruptedException ignored) {}
                        }

                        if (optTask.isPresent()) {
                            Task t = optTask.get();
                            t.setGithubIssueNumber(issueNumber);
                            t.setGithubIssueUrl(issueUrl);
                            taskRepository.save(t);
                        } else {
                            log.warn("Synced Task ID {} not found in database after retries. Ignoring webhook.", syncTaskId);
                        }
                        return;
                    }

                    if (isSyncedIssue) {
                        log.info("Ignoring webhook issues.opened for synced task or subtask #{} to prevent duplicate creation.", issueNumber);
                        return;
                    }

                    if (bug != null || existingTask != null) {
                        log.info("Issue #{} already exists as Bug Report or Task, ignoring webhook duplicate creation.", issueNumber);
                        return; // Ignore duplicates
                    }

                    // Map creator: match GitHub sender's username or fallback to the connector
                    Map<String, Object> sender = (Map<String, Object>) payload.get("sender");
                    String senderUsername = sender != null ? (String) sender.get("login") : null;
                    UserAccount creator = findUserByGitHubUsername(senderUsername, matchedIntegration.getConnectedBy());

                    // Create new BugReport
                    bug = BugReport.builder()
                            .project(matchedIntegration.getProject())
                            .title(title != null ? title.replace("[BUG] ", "") : "GitHub Issue")
                            .description(bodyText)
                            .severity(BugSeverity.MEDIUM)
                            .environment(Environment.DEV)
                            .createdBy(creator)
                            .status(BugStatus.OPEN)
                            .build();
                    bug = bugReportRepository.save(bug);

                    // Create associated task using Task entity directly (tái sử dụng cấu trúc DB cũ)
                    Task task = Task.builder()
                            .project(matchedIntegration.getProject())
                            .title("[BUG] " + bug.getTitle())
                            .description(bug.getDescription())
                            .type(TaskType.BUG_FIX)
                            .priority(Priority.MEDIUM)
                            .status(TaskStatus.TODO)
                            .checklist(new ArrayList<>())
                            .createdBy(creator)
                            .build();

                    // Parse checklist from Markdown
                    if (bodyText != null) {
                        String[] lines = bodyText.split("\\r?\\n");
                        int order = 0;
                        for (String line : lines) {
                            String trimmed = line.trim();
                            if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
                                if (trimmed.startsWith("- [ ] #") || trimmed.startsWith("- [x] #") || trimmed.startsWith("- [X] #") || trimmed.contains("(Pending Sync)")) {
                                    continue;
                                }
                                boolean isDone = trimmed.substring(3, 4).equalsIgnoreCase("x");
                                String content = trimmed.substring(6).trim();
                                TaskChecklist item = TaskChecklist.builder()
                                        .task(task)
                                        .content(content)
                                        .done(isDone)
                                        .orderIndex(order++)
                                        .build();
                                task.getChecklist().add(item);
                            }
                        }
                    }

                    task = taskRepository.save(task);

                    // Link task and save metadata
                    bug.setRelatedTask(task);
                    bug = bugReportRepository.save(bug);
                    saveGitHubMetadata(bug, issueNumber, issueUrl);

                    log.info("Bug Report ID: {} and Task ID: {} successfully auto-created from GitHub Webhook", bug.getId(), task.getId());

                } else if ("closed".equalsIgnoreCase(action)) {
                    if (bug != null) {
                        bug.setStatus(BugStatus.CLOSED);
                        bugReportRepository.save(bug);
                        if (bug.getRelatedTask() != null) {
                            bug.getRelatedTask().setStatus(TaskStatus.DONE);
                            taskRepository.save(bug.getRelatedTask());
                        }
                        log.info("Bug Report ID: {} status marked as CLOSED", bug.getId());
                    } else if (existingTask != null) {
                        existingTask.setStatus(TaskStatus.DONE);
                        existingTask.setCompletedAt(LocalDateTime.now());
                        taskRepository.save(existingTask);
                        log.info("Task ID: {} status marked as DONE from GitHub Webhook", existingTask.getId());
                    }
                } else if ("edited".equalsIgnoreCase(action)) {
                    if (bug != null) {
                        bug.setTitle(title != null ? title.replace("[BUG] ", "") : bug.getTitle());
                        bug.setDescription(extractUserDescription(bodyText));
                        bugReportRepository.save(bug);
                        
                        if (bug.getRelatedTask() != null) {
                            Task task = bug.getRelatedTask();
                            task.setTitle("[BUG] " + bug.getTitle());
                            task.setDescription(extractUserDescription(bodyText));
                            
                            task.getChecklist().clear();
                            if (bodyText != null) {
                                String[] lines = bodyText.split("\\r?\\n");
                                int order = 0;
                                for (String line : lines) {
                                    String trimmed = line.trim();
                                    if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
                                        if (trimmed.startsWith("- [ ] #") || trimmed.startsWith("- [x] #") || trimmed.startsWith("- [X] #") || trimmed.contains("(Pending Sync)")) {
                                            continue;
                                        }
                                        boolean isDone = trimmed.substring(3, 4).equalsIgnoreCase("x");
                                        String content = trimmed.substring(6).trim();
                                        TaskChecklist item = TaskChecklist.builder()
                                                .task(task)
                                                .content(content)
                                                .done(isDone)
                                                .orderIndex(order++)
                                                .build();
                                        task.getChecklist().add(item);
                                    }
                                }
                            }
                            taskRepository.save(task);
                        }
                        log.info("Bug Report ID: {} updated from GitHub Webhook", bug.getId());
                    } else if (existingTask != null) {
                        existingTask.setTitle(title);
                        existingTask.setDescription(extractUserDescription(bodyText));
                        
                        existingTask.getChecklist().clear();
                        if (bodyText != null) {
                            String[] lines = bodyText.split("\\r?\\n");
                            int order = 0;
                            for (String line : lines) {
                                String trimmed = line.trim();
                                if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
                                    if (trimmed.startsWith("- [ ] #") || trimmed.startsWith("- [x] #") || trimmed.startsWith("- [X] #") || trimmed.contains("(Pending Sync)")) {
                                        continue;
                                    }
                                    boolean isDone = trimmed.substring(3, 4).equalsIgnoreCase("x");
                                    String content = trimmed.substring(6).trim();
                                    TaskChecklist item = TaskChecklist.builder()
                                            .task(existingTask)
                                            .content(content)
                                            .done(isDone)
                                            .orderIndex(order++)
                                            .build();
                                    existingTask.getChecklist().add(item);
                                }
                            }
                        }
                        taskRepository.save(existingTask);
                        log.info("Task ID: {} updated from GitHub Webhook", existingTask.getId());
                    }
                } else if ("reopened".equalsIgnoreCase(action)) {
                    if (bug != null) {
                        bug.setStatus(BugStatus.OPEN);
                        bugReportRepository.save(bug);
                        if (bug.getRelatedTask() != null) {
                            bug.getRelatedTask().setStatus(TaskStatus.TODO);
                            taskRepository.save(bug.getRelatedTask());
                        }
                        log.info("Bug Report ID: {} status reopened as OPEN", bug.getId());
                    } else if (existingTask != null) {
                        existingTask.setStatus(TaskStatus.TODO);
                        existingTask.setCompletedAt(null);
                        taskRepository.save(existingTask);
                        log.info("Task ID: {} status marked as TODO from GitHub Webhook", existingTask.getId());
                    }
                } else if ("assigned".equalsIgnoreCase(action) || "unassigned".equalsIgnoreCase(action)) {
                    Map<String, Object> assigneeMap = (Map<String, Object>) issue.get("assignee");
                    String assigneeName = assigneeMap != null ? (String) assigneeMap.get("login") : null;
                    UserAccount assignee = assigneeName != null ? findUserByGitHubUsername(assigneeName, null) : null;

                    if (bug != null) {
                        bug.setAssignedTo(assignee);
                        bugReportRepository.save(bug);

                        if (bug.getRelatedTask() != null) {
                            Task task = bug.getRelatedTask();
                            task.setPrimaryAssignee(assignee);
                            task.getAssignees().clear();
                            if (assignee != null) {
                                task.getAssignees().add(assignee);
                            }
                            taskRepository.save(task);
                        }
                    } else if (existingTask != null) {
                        existingTask.setPrimaryAssignee(assignee);
                        existingTask.getAssignees().clear();
                        if (assignee != null) {
                        existingTask.getAssignees().add(assignee);
                        }
                        taskRepository.save(existingTask);
                        log.info("Task ID: {} assignee updated from GitHub Webhook", existingTask.getId());
                    }
                }

                // Broadcast WebSocket event to refresh frontend issue list in real-time
                try {
                    String wsMessage = String.format("{\"type\":\"REFRESH_BUGS\",\"projectId\":%d}", matchedIntegration.getProject().getId());
                    org.example.backend.config.NotificationWebSocketHandler.broadcast(wsMessage);
                    log.info("📢 Broadcasted REFRESH_BUGS WebSocket event for Project ID: {}", matchedIntegration.getProject().getId());
                } catch (Exception e) {
                    log.error("Failed to broadcast REFRESH_BUGS event for Project ID: {}", matchedIntegration.getProject().getId(), e);
                }
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to handle incoming webhook: ", e);
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

    private String formatIssueBody(BugReport bug) {
        StringBuilder sb = new StringBuilder();
        sb.append("### 📝 Description\n").append(bug.getDescription() != null ? bug.getDescription() : "No description provided.").append("\n\n");

        if (bug.getStepsToReproduce() != null) {
            try {
                Map<String, Object> meta = objectMapper.readValue(bug.getStepsToReproduce(), Map.class);
                if (meta.containsKey("steps")) {
                    sb.append("### 🚶 Steps to Reproduce\n").append(meta.get("steps")).append("\n\n");
                }
            } catch (Exception e) {
                sb.append("### 🚶 Steps to Reproduce\n").append(bug.getStepsToReproduce()).append("\n\n");
            }
        }

        sb.append("### 🛠️ Technical Details\n");
        sb.append("- **Severity:** ").append(bug.getSeverity() != null ? bug.getSeverity().name() : "N/A").append("\n");
        sb.append("- **Environment:** ").append(bug.getEnvironment() != null ? bug.getEnvironment().name() : "N/A").append("\n");
        sb.append("- **Reporter:** ").append(bug.getCreatedBy() != null ? bug.getCreatedBy().getUsername() : "System").append("\n\n");

        // Format task checklist if available
        if (bug.getRelatedTask() != null && bug.getRelatedTask().getChecklist() != null && !bug.getRelatedTask().getChecklist().isEmpty()) {
            sb.append("### 📋 Checklist\n");
            List<TaskChecklist> checklist = bug.getRelatedTask().getChecklist();
            for (TaskChecklist item : checklist) {
                sb.append(item.isDone() ? "- [x] " : "- [ ] ").append(item.getContent()).append("\n");
            }
            sb.append("\n");
        }

        sb.append("\n<!-- devtrack-bug-id: ").append(bug.getId()).append(" -->\n");
        sb.append("> *Sync generated automatically by DevTrack AI module.*");
        return sb.toString();
    }

    private void saveGitHubMetadata(BugReport bug, Integer issueNumber, String issueUrl) {
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

    private Integer getGitHubIssueNumber(BugReport bug) {
        if (bug.getStepsToReproduce() == null) return null;
        try {
            Map<String, Object> meta = objectMapper.readValue(bug.getStepsToReproduce(), Map.class);
            Object number = meta.get("github_issue_number");
            return number instanceof Number ? ((Number) number).intValue() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private BugReport findBugReportByIssueNumber(Long projectId, Integer issueNumber) {
        List<BugReport> projectBugs = bugReportRepository.findByProjectId(projectId);
        for (BugReport bug : projectBugs) {
            Integer num = getGitHubIssueNumber(bug);
            if (num != null && num.equals(issueNumber)) {
                return bug;
            }
        }
        return null;
    }

    private UserAccount findUserByGitHubUsername(String githubUsername, UserAccount fallback) {
        if (githubUsername == null || githubUsername.trim().isEmpty()) return fallback;
        // Search user by case-insensitive username match or fallback
        return userAccountRepository.findByUsername(githubUsername)
                .orElse(userAccountRepository.findByEmail(githubUsername)
                        .orElse(fallback));
    }

    private boolean isValidSignature(byte[] payload, String signatureHeader, String secret) {
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) return false;
        String signature = signatureHeader.substring(7);
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("Failed to verify webhook signature: ", e);
            return false;
        }
    }

    /**
     * Helper decrypting the access token using EncryptionService.
     */
    public String decryptToken(String encrypted) {
        return encryptionService.decrypt(encrypted);
    }

    @Override
    public Map<String, Object> getWebhookDeliveryStatus(Long projectId, Long userId) {
        GitHubIntegration integration = getIntegration(projectId, userId);
        if (integration == null) return null;

        UserGithubToken userToken = userGithubTokenRepository.findById(userId).orElse(null);
        if (userToken == null) return null;

        String accessToken = decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/hooks",
                integration.getRepoOwner(), integration.getRepoName());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> hooks = response.getBody();
                for (Map<String, Object> hook : hooks) {
                    Map<String, Object> config = (Map<String, Object>) hook.get("config");
                    if (config != null) {
                        String hookUrl = (String) config.get("url");
                        if (hookUrl != null && hookUrl.contains("/api/v1/github/webhook")) {
                            Map<String, Object> lastResponse = (Map<String, Object>) hook.get("last_response");
                            Map<String, Object> statusMap = new HashMap<>();
                            
                            if (lastResponse != null) {
                                String status = (String) lastResponse.get("status");
                                Object codeObj = lastResponse.get("code");
                                Integer code = null;
                                if (codeObj instanceof Number) {
                                    code = ((Number) codeObj).intValue();
                                } else if (codeObj instanceof String) {
                                    try { code = Integer.parseInt((String) codeObj); } catch (Exception ignored) {}
                                }
                                
                                if (status == null || "unused".equalsIgnoreCase(status)) {
                                    statusMap.put("webhookStatus", "PENDING");
                                } else if (code != null && code >= 200 && code < 300) {
                                    statusMap.put("webhookStatus", "HEALTHY");
                                    statusMap.put("lastWebhookReceivedAt", hook.get("updated_at"));
                                } else {
                                    statusMap.put("webhookStatus", "FAILED");
                                    statusMap.put("lastWebhookReceivedAt", hook.get("updated_at"));
                                }
                            } else {
                                statusMap.put("webhookStatus", "PENDING");
                            }
                            return statusMap;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch webhook status from GitHub API for project {}: {}", projectId, e.getMessage());
        }
        
        // Default if not found or API failed
        Map<String, Object> defaultMap = new HashMap<>();
        defaultMap.put("webhookStatus", "PENDING");
        return defaultMap;
    }

    @Override
    public void pingWebhook(Long projectId, Long userId) {
        GitHubIntegration integration = getIntegration(projectId, userId);
        if (integration == null) throw new CustomException("Integration not found", HttpStatus.NOT_FOUND);

        UserGithubToken userToken = userGithubTokenRepository.findById(userId).orElse(null);
        if (userToken == null) throw new CustomException("GitHub token missing", HttpStatus.UNAUTHORIZED);

        String accessToken = decryptToken(userToken.getAccessTokenEncrypted());
        String url = String.format("https://api.github.com/repos/%s/%s/hooks",
                integration.getRepoOwner(), integration.getRepoName());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> hooks = response.getBody();
                for (Map<String, Object> hook : hooks) {
                    Map<String, Object> config = (Map<String, Object>) hook.get("config");
                    if (config != null) {
                        String hookUrl = (String) config.get("url");
                        if (hookUrl != null && hookUrl.contains("/api/v1/github/webhook")) {
                            Object hookIdObj = hook.get("id");
                            Long hookId = null;
                            if (hookIdObj instanceof Number) {
                                hookId = ((Number) hookIdObj).longValue();
                            } else if (hookIdObj instanceof String) {
                                hookId = Long.parseLong((String) hookIdObj);
                            }
                            
                            if (hookId != null) {
                                // Call ping API
                                String pingUrl = String.format("https://api.github.com/repos/%s/%s/hooks/%d/pings",
                                        integration.getRepoOwner(), integration.getRepoName(), hookId);
                                restTemplate.exchange(pingUrl, HttpMethod.POST, entity, Void.class);
                                log.info("Successfully triggered ping for webhook ID {} on repo {}/{}", hookId, integration.getRepoOwner(), integration.getRepoName());
                                return;
                            }
                        }
                    }
                }
            }
            throw new CustomException("Webhook configuration not found on GitHub", HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            log.error("Failed to ping webhook for project {}: {}", projectId, e.getMessage());
            throw new CustomException("Failed to ping webhook: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public GitHubIntegration getIntegration(Long projectId, Long userId) {
        // Verify caller is a project member
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        return gitHubIntegrationRepository.findByProjectId(projectId).orElse(null);
    }

    @Override
    public boolean hasUserToken(Long userId) {
        return userGithubTokenRepository.findById(userId).isPresent();
    }

    @Override
    public Map<String, Object> getRateLimit(Long projectId, Long userId) {
        GitHubIntegration integration = getIntegration(projectId, userId);
        if (integration == null) return null;
        
        UserGithubToken userToken = userGithubTokenRepository.findById(userId).orElse(null);
        if (userToken == null || userToken.getAccessTokenEncrypted() == null || userToken.getAccessTokenEncrypted().isEmpty()) {
            return null;
        }

        String accessToken = decryptToken(userToken.getAccessTokenEncrypted());
        HttpHeaders headers = createGitHubHeaders(accessToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange("https://api.github.com/rate_limit", HttpMethod.GET, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> resources = (Map<String, Object>) response.getBody().get("resources");
                return (Map<String, Object>) resources.get("core");
            }
        } catch (Exception e) {
            log.error("Failed to fetch rate limit from GitHub API", e);
        }
        return null;
    }

    @Override
    public GitHubIntegration saveIntegration(Long projectId, Map<String, Object> request, Long userId) {
        // 1. Authorize: must be PROJECT_LEADER
        ProjectMember caller = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));
        
        if (!isLeaderRole(caller.getRole().getName())) {
            throw new CustomException("Only Project Leaders are authorized to configure GitHub integration.", HttpStatus.FORBIDDEN);
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        String repoOwner = (String) request.get("repoOwner");
        String repoName = (String) request.get("repoName");
        String webhookSecret = (String) request.get("webhookSecret");

        if (repoOwner == null || repoOwner.trim().isEmpty()) {
            throw new CustomException("Repository Owner is required", HttpStatus.BAD_REQUEST);
        }
        if (repoName == null || repoName.trim().isEmpty()) {
            throw new CustomException("Repository Name is required", HttpStatus.BAD_REQUEST);
        }

        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElse(GitHubIntegration.builder().project(project).build());

        integration.setRepoOwner(repoOwner.trim());
        integration.setRepoName(repoName.trim());
        integration.setConnectedBy(user);
        
        if (webhookSecret != null && !webhookSecret.trim().isEmpty()) {
            integration.setWebhookSecretEncrypted(encryptToken(webhookSecret.trim()));
        }

        boolean hasToken = userGithubTokenRepository.findById(userId).isPresent();
        if (!hasToken) {
            throw new CustomException("You must link your GitHub account first.", HttpStatus.BAD_REQUEST);
        }

        return gitHubIntegrationRepository.save(integration);
    }

    @Override
    public String encryptToken(String plaintext) {
        return encryptionService.encrypt(plaintext);
    }

    /**
     * Returns true if the role name represents a project leader.
     * Accepts both 'LEADER' (DB seed value) and 'PROJECT_LEADER' (DataInitializer value).
     */
    private boolean isLeaderRole(String roleName) {
        return "LEADER".equalsIgnoreCase(roleName) || "PROJECT_LEADER".equalsIgnoreCase(roleName);
    }

    @Override
    public Object getWebhookDeliveries(Long projectId, Long userId) {
        GitHubIntegration integration = getIntegration(projectId, userId);
        if (integration == null) throw new CustomException("GitHub integration not found", HttpStatus.NOT_FOUND);

        String token = getDecryptedUserToken(userId);
        String hooksUrl = "https://api.github.com/repos/" + integration.getRepoOwner()
                + "/" + integration.getRepoName() + "/hooks";

        // 1. Get hook list to find hook ID
        HttpHeaders headers = buildAuthHeaders(token);
        ResponseEntity<List> hooksResp = restTemplate.exchange(hooksUrl, HttpMethod.GET,
                new HttpEntity<>(headers), List.class);
        if (hooksResp.getBody() == null || hooksResp.getBody().isEmpty()) {
            throw new CustomException("No webhook found on GitHub repository", HttpStatus.NOT_FOUND);
        }
        
        Long hookId = null;
        for (Object item : hooksResp.getBody()) {
            Map<String, Object> hook = (Map<String, Object>) item;
            Map<String, Object> config = (Map<String, Object>) hook.get("config");
            if (config != null && config.get("url") != null && config.get("url").toString().contains("/api/v1/github/webhook")) {
                Object idObj = hook.get("id");
                if (idObj instanceof Number) hookId = ((Number) idObj).longValue();
                else if (idObj instanceof String) hookId = Long.parseLong((String) idObj);
                break;
            }
        }
        
        if (hookId == null) {
             throw new CustomException("Could not find the specific Audit Tool webhook on this repository", HttpStatus.NOT_FOUND);
        }

        // 2. Get deliveries for that hook
        String deliveriesUrl = hooksUrl + "/" + hookId + "/deliveries?per_page=30";
        ResponseEntity<List> deliveriesResp = restTemplate.exchange(deliveriesUrl, HttpMethod.GET,
                new HttpEntity<>(headers), List.class);
                
        // Fix JavaScript precision loss: convert huge Long IDs to Strings before returning to frontend
        List<Map<String, Object>> deliveries = deliveriesResp.getBody();
        if (deliveries != null) {
            for (Map<String, Object> delivery : deliveries) {
                if (delivery.get("id") != null) {
                    delivery.put("id", delivery.get("id").toString());
                }
            }
        }
        return deliveries;
    }

    @Override
    public void redeliverWebhook(Long projectId, Long deliveryId, Long userId) {
        GitHubIntegration integration = getIntegration(projectId, userId);
        if (integration == null) throw new CustomException("GitHub integration not found", HttpStatus.NOT_FOUND);

        String token = getDecryptedUserToken(userId);
        String hooksUrl = "https://api.github.com/repos/" + integration.getRepoOwner()
                + "/" + integration.getRepoName() + "/hooks";

        // 1. Get hook ID
        HttpHeaders headers = buildAuthHeaders(token);
        ResponseEntity<List> hooksResp = restTemplate.exchange(hooksUrl, HttpMethod.GET,
                new HttpEntity<>(headers), List.class);
        if (hooksResp.getBody() == null || hooksResp.getBody().isEmpty()) {
            throw new CustomException("No webhook found on GitHub repository", HttpStatus.NOT_FOUND);
        }
        
        Long hookId = null;
        for (Object item : hooksResp.getBody()) {
            Map<String, Object> hook = (Map<String, Object>) item;
            Map<String, Object> config = (Map<String, Object>) hook.get("config");
            if (config != null && config.get("url") != null && config.get("url").toString().contains("/api/v1/github/webhook")) {
                Object idObj = hook.get("id");
                if (idObj instanceof Number) hookId = ((Number) idObj).longValue();
                else if (idObj instanceof String) hookId = Long.parseLong((String) idObj);
                break;
            }
        }

        if (hookId == null) {
            throw new CustomException("Could not find the specific Audit Tool webhook on this repository", HttpStatus.NOT_FOUND);
        }

        // 2. Trigger redeliver
        String redeliverUrl = hooksUrl + "/" + hookId + "/deliveries/" + deliveryId + "/attempts";
        try {
            // Need empty body string for POST requests sometimes
            HttpEntity<String> entity = new HttpEntity<>("", headers);
            restTemplate.exchange(redeliverUrl, HttpMethod.POST, entity, String.class);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Failed to redeliver webhook {}. HTTP {}. Body: {}", deliveryId, e.getStatusCode(), errorBody);
            throw new CustomException("GitHub API Error: " + errorBody, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Failed to redeliver webhook for delivery ID {}", deliveryId, e);
            throw new CustomException("Failed to trigger redelivery: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
        log.info("Webhook delivery {} redelivered for project {}", deliveryId, projectId);
    }

    /** Builds GitHub authorization headers with Bearer token */
    private HttpHeaders buildAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Accept", "application/vnd.github+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }

    /** Gets decrypted PAT for userId, throws if not found */
    private String getDecryptedUserToken(Long userId) {
        return userGithubTokenRepository.findById(userId)
                .map(t -> decryptToken(t.getAccessTokenEncrypted()))
                .orElseThrow(() -> new CustomException("No GitHub token configured for this user", HttpStatus.BAD_REQUEST));
    }

    @Override
    public String getOAuthUrl() {
        return String.format("https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo,read:user&prompt=consent", clientId, redirectUri);
    }

    @Override
    public String exchangeCodeForToken(String code, Long userId) {
        String url = "https://github.com/login/oauth/access_token";
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = new HashMap<>();
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("code", code);
        body.put("redirect_uri", redirectUri);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String accessToken = (String) response.getBody().get("access_token");
                if (accessToken != null) {
                    UserAccount user = userAccountRepository.findById(userId).orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
                    UserGithubToken token = userGithubTokenRepository.findById(userId).orElse(UserGithubToken.builder().user(user).build());
                    token.setAccessTokenEncrypted(encryptToken(accessToken));
                    token.setUpdatedAt(LocalDateTime.now());
                    userGithubTokenRepository.save(token);
                    log.info("✅ GitHub OAuth successful! Access token encrypted and saved for User ID: {}", userId);
                    return "Success";
                } else {
                    throw new CustomException("Failed to retrieve access token from GitHub", HttpStatus.BAD_REQUEST);
                }
            }
        } catch (Exception e) {
            log.error("Error exchanging code for token", e);
            throw new CustomException("Failed to exchange code for token: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
        throw new CustomException("Failed to connect to GitHub", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Override
    public Object getUserRepositories(Long userId) {
        String token = getDecryptedUserToken(userId);
        HttpHeaders headers = buildAuthHeaders(token);
        String url = "https://api.github.com/user/repos?sort=updated&per_page=100";
        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch user repositories", e);
            throw new CustomException("Failed to fetch user repositories from GitHub", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @Override
    public Object createRepository(Long userId, String name, String description, boolean isPrivate) {
        String token = getDecryptedUserToken(userId);
        HttpHeaders headers = buildAuthHeaders(token);
        String url = "https://api.github.com/user/repos";
        
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        if (description != null && !description.trim().isEmpty()) {
            body.put("description", description);
        }
        body.put("private", isPrivate);
        
        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            return response.getBody();
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Failed to create GitHub repository. HTTP {}. Body: {}", e.getStatusCode(), errorBody);
            throw new CustomException("Failed to create GitHub repository: " + errorBody, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Failed to create GitHub repository", e);
            throw new CustomException("Failed to create GitHub repository", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    @Override
    public void autoConfigureWebhook(Long projectId, Long userId, String webhookUrl, List<String> events, String webhookSecret) {
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CustomException("No GitHub configuration found for this project", HttpStatus.BAD_REQUEST));
        
        String token = getDecryptedUserToken(userId);
        HttpHeaders headers = buildAuthHeaders(token);
        String hooksUrl = "https://api.github.com/repos/" + integration.getRepoOwner()
                + "/" + integration.getRepoName() + "/hooks";
                
        // 0. Update secret if a new one is provided
        if (webhookSecret != null && !webhookSecret.trim().isEmpty()) {
            integration.setWebhookSecretEncrypted(encryptToken(webhookSecret.trim()));
            gitHubIntegrationRepository.save(integration);
        }
        
        // 1. Check if webhook already exists
        try {
            ResponseEntity<List> hooksResp = restTemplate.exchange(hooksUrl, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            if (hooksResp.getBody() != null) {
                for (Object item : hooksResp.getBody()) {
                    Map<String, Object> hook = (Map<String, Object>) item;
                    Map<String, Object> config = (Map<String, Object>) hook.get("config");
                    if (config != null && webhookUrl.equals(config.get("url"))) {
                        // Webhook already exists, update it to be safe
                        Long hookId = ((Number) hook.get("id")).longValue();
                        updateWebhook(hookId, hooksUrl, webhookUrl, integration.getWebhookSecretEncrypted(), events, headers);
                        return;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch existing webhooks", e);
            throw new CustomException("Failed to check existing webhooks on GitHub", HttpStatus.BAD_REQUEST);
        }

        // 2. Create new webhook
        Map<String, Object> body = new HashMap<>();
        body.put("name", "web");
        body.put("active", true);
        if (events == null || events.isEmpty()) {
            body.put("events", Arrays.asList("push"));
        } else if (events.contains("*")) {
            body.put("events", Arrays.asList("*"));
        } else {
            body.put("events", events);
        }
        
        Map<String, String> config = new HashMap<>();
        config.put("url", webhookUrl);
        config.put("content_type", "json");
        config.put("insecure_ssl", "0");
        String secret = decryptToken(integration.getWebhookSecretEncrypted());
        config.put("secret", secret);
        
        body.put("config", config);
        
        try {
            restTemplate.postForEntity(hooksUrl, new HttpEntity<>(body, headers), Map.class);
            log.info("Auto-configured webhook for project {} at {}", projectId, hooksUrl);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Failed to create webhook. HTTP {}. Body: {}", e.getStatusCode(), errorBody);
            throw new CustomException("GitHub API Error: " + errorBody, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Failed to create webhook", e);
            throw new CustomException("Failed to auto-configure webhook on GitHub", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void updateWebhook(Long hookId, String hooksUrl, String webhookUrl, String encryptedSecret, List<String> events, HttpHeaders headers) {
        String updateUrl = hooksUrl + "/" + hookId;
        Map<String, Object> body = new HashMap<>();
        body.put("active", true);
        if (events == null || events.isEmpty()) {
            body.put("events", Arrays.asList("push"));
        } else if (events.contains("*")) {
            body.put("events", Arrays.asList("*"));
        } else {
            body.put("events", events);
        }
        
        Map<String, String> config = new HashMap<>();
        config.put("url", webhookUrl);
        config.put("content_type", "json");
        config.put("insecure_ssl", "0");
        config.put("secret", decryptToken(encryptedSecret));
        
        body.put("config", config);
        
        try {
            // Using PATCH to update
            restTemplate.exchange(updateUrl, HttpMethod.PATCH, new HttpEntity<>(body, headers), Map.class);
            log.info("Updated existing webhook {} at {}", hookId, updateUrl);
        } catch (Exception e) {
            log.warn("Failed to update existing webhook. It might still work if config is identical.", e);
        }
    }
}
