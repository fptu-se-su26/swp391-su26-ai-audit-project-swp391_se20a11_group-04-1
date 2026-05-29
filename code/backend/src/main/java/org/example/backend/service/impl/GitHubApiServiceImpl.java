package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.entity.enums.BugSeverity;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.entity.enums.Environment;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.GitHubApiService;
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
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String ALGORITHM = "AES";
    
    @Value("${github.encryption.key}")
    private String encryptionKey;

    @Override
    public void createGitHubIssue(BugReport bugReport, Long userId) {
        Long projectId = bugReport.getProject().getId();
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CustomException("GitHub integration not found for this project", HttpStatus.BAD_REQUEST));

        UserGithubToken userToken = userGithubTokenRepository.findById(userId)
                .orElseThrow(() -> new CustomException("No GitHub Personal Access Token configured for your account. Please configure it in the project settings.", HttpStatus.BAD_REQUEST));

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
            } else {
                throw new CustomException("Failed to create GitHub issue: Unexpected response status", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch (Exception e) {
            log.error("Error creating GitHub issue: ", e);
            throw new CustomException("Failed to synchronize with GitHub API: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
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

        UserGithubToken userToken = userGithubTokenRepository.findById(userId).orElse(null);
        if (userToken == null) {
            log.warn("Skipping GitHub status sync. No GitHub token configured for user ID: {}", userId);
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

            if (!isValidSignature(payloadBytes, signatureHeader, decryptToken(matchedIntegration.getWebhookSecretEncrypted()))) {
                log.error("Webhook signature mismatch for repo: {}/{}", repoOwner, repoName);
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

                if ("opened".equalsIgnoreCase(action)) {
                    if (bug != null) {
                        log.info("Bug report already exists for Issue #{}", issueNumber);
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
                    }
                } else if ("assigned".equalsIgnoreCase(action) || "unassigned".equalsIgnoreCase(action)) {
                    if (bug != null) {
                        Map<String, Object> assigneeMap = (Map<String, Object>) issue.get("assignee");
                        String assigneeName = assigneeMap != null ? (String) assigneeMap.get("login") : null;
                        UserAccount assignee = assigneeName != null ? findUserByGitHubUsername(assigneeName, null) : null;

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
                    }
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
     * Helper decrypting the access token using standard AES-128 key.
     * Fallbacks to raw Base64 decode or plaintext if not encrypted to ensure backward compatibility.
     */
    public String decryptToken(String encrypted) {
        if (encrypted == null || encrypted.trim().isEmpty()) return encrypted;
        try {
            SecretKeySpec secretKey = new SecretKeySpec(encryptionKey.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encrypted));
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            // Decryption failed. It is not a valid encrypted token.
            return null;
        }
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
        String accessToken = (String) request.get("accessToken");
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

        // Upsert user's PAT to user_github_tokens table if provided
        if (accessToken != null && !accessToken.trim().isEmpty()) {
            UserGithubToken userToken = userGithubTokenRepository.findById(userId)
                    .orElse(UserGithubToken.builder().user(user).build());
            userToken.setAccessTokenEncrypted(encryptToken(accessToken.trim()));
            userToken.setUpdatedAt(java.time.LocalDateTime.now());
            userGithubTokenRepository.save(userToken);
        }

        boolean hasToken = userGithubTokenRepository.findById(userId).isPresent();
        if (!hasToken) {
            throw new CustomException("Personal Access Token (PAT) is required for the first GitHub connection.", HttpStatus.BAD_REQUEST);
        }

        return gitHubIntegrationRepository.save(integration);
    }

    @Override
    public String encryptToken(String plaintext) {
        if (plaintext == null || plaintext.trim().isEmpty()) return plaintext;
        try {
            SecretKeySpec secretKey = new SecretKeySpec(encryptionKey.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encryptedBytes = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            log.error("Failed to encrypt GitHub token: ", e);
            return plaintext;
        }
    }

    /**
     * Returns true if the role name represents a project leader.
     * Accepts both 'LEADER' (DB seed value) and 'PROJECT_LEADER' (DataInitializer value).
     */
    private boolean isLeaderRole(String roleName) {
        return "LEADER".equalsIgnoreCase(roleName) || "PROJECT_LEADER".equalsIgnoreCase(roleName);
    }
}
