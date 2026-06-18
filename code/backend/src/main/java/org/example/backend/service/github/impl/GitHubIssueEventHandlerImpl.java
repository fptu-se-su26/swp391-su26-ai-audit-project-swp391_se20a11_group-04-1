package org.example.backend.service.github.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.NotificationWebSocketHandler;
import org.example.backend.entity.BugReport;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.Priority;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskChecklist;
import org.example.backend.entity.TaskStatus;
import org.example.backend.entity.TaskType;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.enums.BugSeverity;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.entity.enums.Environment;
import org.example.backend.repository.BugReportRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.github.issue.GitHubIssueEventHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GitHubIssueEventHandlerImpl implements GitHubIssueEventHandler {

    private final BugReportRepository bugReportRepository;
    private final TaskRepository taskRepository;
    private final UserAccountRepository userAccountRepository;
    private final ObjectMapper objectMapper;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    @Override
    public void handleIssueEvent(String action, Map<String, Object> issue, Map<String, Object> payload, GitHubIntegration integration) {
        if (issue == null) return;

        Integer issueNumber = (Integer) issue.get("number");
        String issueUrl = (String) issue.get("html_url");
        String title = (String) issue.get("title");
        String bodyText = (String) issue.get("body");
        Long projectId = integration.getProject().getId();

        log.info("Processing webhook event: issues.{} for Issue #{}", action, issueNumber);

        BugReport bug = findBugReportByIssueNumber(projectId, issueNumber);
        Task existingTask = taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId).stream()
                .filter(task -> task.getGithubIssueNumber() != null && task.getGithubIssueNumber().equals(issueNumber))
                .findFirst()
                .orElse(null);

        if ("opened".equalsIgnoreCase(action)) {
            handleOpened(issueNumber, issueUrl, title, bodyText, payload, integration, bug, existingTask);
        } else if ("closed".equalsIgnoreCase(action)) {
            handleClosed(bug, existingTask);
        } else if ("edited".equalsIgnoreCase(action)) {
            handleEdited(title, bodyText, bug, existingTask);
        } else if ("reopened".equalsIgnoreCase(action)) {
            handleReopened(bug, existingTask);
        } else if ("assigned".equalsIgnoreCase(action) || "unassigned".equalsIgnoreCase(action)) {
            handleAssigneeChanged(issue, bug, existingTask);
        }

        broadcastRefresh(projectId);
    }

    private void handleOpened(
            Integer issueNumber,
            String issueUrl,
            String title,
            String bodyText,
            Map<String, Object> payload,
            GitHubIntegration integration,
            BugReport bug,
            Task existingTask) {
        Long syncBugId = extractSyncId(bodyText, "devtrack-bug-id");
        Long syncTaskId = extractSyncId(bodyText, "devtrack-task-id");
        List<Map<String, Object>> labels = (List<Map<String, Object>>) payload.getOrDefault("labels", null);
        Map<String, Object> issue = (Map<String, Object>) payload.get("issue");
        if (issue != null) {
            labels = (List<Map<String, Object>>) issue.get("labels");
        }

        boolean hasBugLabel = hasLabel(labels, "bug");
        boolean isSubTask = hasLabel(labels, "sub-task") || (title != null && title.startsWith("[Sub-task]"));

        if (syncBugId != null) {
            linkSyncedBug(syncBugId, issueNumber, issueUrl);
            return;
        }

        if (syncTaskId != null) {
            linkSyncedTask(syncTaskId, issueNumber, issueUrl);
            return;
        }

        if (isSubTask) {
            log.info("Ignoring webhook issues.opened for synced sub-task #{} to prevent duplicate creation.", issueNumber);
            return;
        }

        if (bug != null || existingTask != null) {
            log.info("Issue #{} already exists as Bug Report or Task, ignoring webhook duplicate creation.", issueNumber);
            return;
        }

        Map<String, Object> sender = (Map<String, Object>) payload.get("sender");
        String senderUsername = sender != null ? (String) sender.get("login") : null;
        UserAccount creator = findUserByGitHubUsername(senderUsername, integration.getConnectedBy());

        if (hasBugLabel) {
            BugReport newBug = BugReport.builder()
                    .project(integration.getProject())
                    .title(title != null ? title.replace("[BUG] ", "") : "GitHub Issue")
                    .description(bodyText)
                    .severity(BugSeverity.MEDIUM)
                    .environment(Environment.DEV)
                    .createdBy(creator)
                    .status(BugStatus.OPEN)
                    .build();
            newBug = bugReportRepository.save(newBug);

            Task task = Task.builder()
                    .project(integration.getProject())
                    .title("[BUG] " + newBug.getTitle())
                    .description(newBug.getDescription())
                    .type(TaskType.BUG_FIX)
                    .priority(Priority.MEDIUM)
                    .status(TaskStatus.TODO)
                    .checklist(new ArrayList<>())
                    .createdBy(creator)
                    .githubIssueNumber(issueNumber)
                    .githubIssueUrl(issueUrl)
                    .build();
            applyChecklistFromMarkdown(task, bodyText);
            task = taskRepository.save(task);

            newBug.setRelatedTask(task);
            newBug = bugReportRepository.save(newBug);
            saveGitHubMetadata(newBug, issueNumber, issueUrl);

            log.info("Bug Report ID: {} and Task ID: {} successfully auto-created from GitHub Webhook", newBug.getId(), task.getId());
            return;
        }

        String finalDescription = bodyText != null
                ? bodyText + "\n\n<!-- sync-source: github-blank-draft -->"
                : "<!-- sync-source: github-blank-draft -->";
        Task task = Task.builder()
                .project(integration.getProject())
                .title(title != null ? title : "GitHub Issue")
                .description(finalDescription)
                .type(resolveTaskTypeFromLabels(labels))
                .priority(Priority.MEDIUM)
                .status(TaskStatus.TODO)
                .checklist(new ArrayList<>())
                .createdBy(creator)
                .githubIssueNumber(issueNumber)
                .githubIssueUrl(issueUrl)
                .build();
        applyChecklistFromMarkdown(task, bodyText);
        task = taskRepository.save(task);

        log.info("Task ID: {} successfully auto-created from GitHub Webhook as Blank Issue", task.getId());
    }

    private void linkSyncedBug(Long bugId, Integer issueNumber, String issueUrl) {
        log.info("Webhook issues.opened recognized synced Bug Report ID: {} for Issue #{}", bugId, issueNumber);
        java.util.Optional<BugReport> optBug = retryFindBug(bugId);
        if (optBug.isEmpty()) {
            log.warn("Synced Bug Report ID {} not found in database after retries. Ignoring webhook.", bugId);
            return;
        }

        BugReport bug = optBug.get();
        saveGitHubMetadata(bug, issueNumber, issueUrl);
        if (bug.getRelatedTask() != null) {
            Task task = bug.getRelatedTask();
            task.setGithubIssueNumber(issueNumber);
            task.setGithubIssueUrl(issueUrl);
            taskRepository.save(task);
        }
    }

    private void linkSyncedTask(Long taskId, Integer issueNumber, String issueUrl) {
        log.info("Webhook issues.opened recognized synced Task ID: {} for Issue #{}", taskId, issueNumber);
        java.util.Optional<Task> optTask = retryFindTask(taskId);
        if (optTask.isEmpty()) {
            log.warn("Synced Task ID {} not found in database after retries. Ignoring webhook.", taskId);
            return;
        }

        Task task = optTask.get();
        task.setGithubIssueNumber(issueNumber);
        task.setGithubIssueUrl(issueUrl);
        taskRepository.save(task);
    }

    private void handleClosed(BugReport bug, Task existingTask) {
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
    }

    private void handleEdited(String title, String bodyText, BugReport bug, Task existingTask) {
        if (bug != null) {
            bug.setTitle(title != null ? title.replace("[BUG] ", "") : bug.getTitle());
            bug.setDescription(extractUserDescription(bodyText));
            bugReportRepository.save(bug);

            if (bug.getRelatedTask() != null) {
                Task task = bug.getRelatedTask();
                task.setTitle("[BUG] " + bug.getTitle());
                task.setDescription(extractUserDescription(bodyText));
                task.getChecklist().clear();
                applyChecklistFromMarkdown(task, bodyText);
                taskRepository.save(task);
            }
            log.info("Bug Report ID: {} updated from GitHub Webhook", bug.getId());
        } else if (existingTask != null) {
            existingTask.setTitle(title);
            existingTask.setDescription(extractUserDescription(bodyText));
            existingTask.getChecklist().clear();
            applyChecklistFromMarkdown(existingTask, bodyText);
            taskRepository.save(existingTask);
            log.info("Task ID: {} updated from GitHub Webhook", existingTask.getId());
        }
    }

    private void handleReopened(BugReport bug, Task existingTask) {
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
    }

    private void handleAssigneeChanged(Map<String, Object> issue, BugReport bug, Task existingTask) {
        Map<String, Object> assigneeMap = (Map<String, Object>) issue.get("assignee");
        String assigneeName = assigneeMap != null ? (String) assigneeMap.get("login") : null;
        UserAccount assignee = assigneeName != null ? findUserByGitHubUsername(assigneeName, null) : null;

        if (bug != null) {
            bug.setAssignedTo(assignee);
            bugReportRepository.save(bug);

            if (bug.getRelatedTask() != null) {
                applyAssignee(bug.getRelatedTask(), assignee);
            }
        } else if (existingTask != null) {
            applyAssignee(existingTask, assignee);
            log.info("Task ID: {} assignee updated from GitHub Webhook", existingTask.getId());
        }
    }

    private void applyAssignee(Task task, UserAccount assignee) {
        task.setPrimaryAssignee(assignee);
        task.getAssignees().clear();
        if (assignee != null) {
            task.getAssignees().add(assignee);
        }
        taskRepository.save(task);
    }

    private void applyChecklistFromMarkdown(Task task, String bodyText) {
        if (bodyText == null) return;

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

    private TaskType resolveTaskTypeFromLabels(List<Map<String, Object>> labels) {
        if (hasLabel(labels, "documentation")) {
            return TaskType.DOCUMENTATION;
        }
        if (hasLabel(labels, "testing")) {
            return TaskType.TESTING;
        }
        return TaskType.DEVELOPMENT;
    }

    private boolean hasLabel(List<Map<String, Object>> labels, String expected) {
        if (labels == null || expected == null) {
            return false;
        }
        for (Map<String, Object> label : labels) {
            Object name = label.get("name");
            if (name != null && expected.equalsIgnoreCase(name.toString())) {
                return true;
            }
        }
        return false;
    }

    private Long extractSyncId(String bodyText, String marker) {
        if (bodyText == null || marker == null) {
            return null;
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("<!--\\s*" + java.util.regex.Pattern.quote(marker) + ":\\s*(\\d+)\\s*-->")
                .matcher(bodyText);
        return matcher.find() ? Long.parseLong(matcher.group(1)) : null;
    }

    private java.util.Optional<BugReport> retryFindBug(Long bugId) {
        java.util.Optional<BugReport> result = java.util.Optional.empty();
        for (int i = 0; i < 3; i++) {
            result = bugReportRepository.findById(bugId);
            if (result.isPresent()) {
                break;
            }
            sleepQuietly();
        }
        return result;
    }

    private java.util.Optional<Task> retryFindTask(Long taskId) {
        java.util.Optional<Task> result = java.util.Optional.empty();
        for (int i = 0; i < 3; i++) {
            result = taskRepository.findById(taskId);
            if (result.isPresent()) {
                break;
            }
            sleepQuietly();
        }
        return result;
    }

    private void sleepQuietly() {
        try {
            Thread.sleep(500);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    private BugReport findBugReportByIssueNumber(Long projectId, Integer issueNumber) {
        List<BugReport> projectBugs = bugReportRepository.findByProjectId(projectId);
        for (BugReport bug : projectBugs) {
            Integer number = getGitHubIssueNumber(bug);
            if (number != null && number.equals(issueNumber)) {
                return bug;
            }
        }
        return null;
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

    private UserAccount findUserByGitHubUsername(String githubUsername, UserAccount fallback) {
        if (githubUsername == null || githubUsername.trim().isEmpty()) return fallback;
        return userAccountRepository.findByUsername(githubUsername)
                .orElse(userAccountRepository.findByEmail(githubUsername).orElse(fallback));
    }

    private String extractUserDescription(String fullBody) {
        if (fullBody == null) return null;
        int descIdx = fullBody.indexOf("### Description");
        if (descIdx == -1) {
            return fullBody;
        }

        int startIdx = descIdx + "### Description".length();
        while (startIdx < fullBody.length() && (fullBody.charAt(startIdx) == '\r' || fullBody.charAt(startIdx) == '\n')) {
            startIdx++;
        }

        int nextSectionIdx = fullBody.length();
        for (String marker : List.of("### Checklist", "### Sub-tasks", "> *Sync generated")) {
            int markerIndex = fullBody.indexOf(marker, startIdx);
            if (markerIndex != -1 && markerIndex < nextSectionIdx) {
                nextSectionIdx = markerIndex;
            }
        }

        return fullBody.substring(startIdx, nextSectionIdx).trim();
    }

    private void broadcastRefresh(Long projectId) {
        try {
            String wsMessage = String.format("{\"type\":\"REFRESH_BUGS\",\"projectId\":%d}", projectId);
            notificationWebSocketHandler.broadcast(wsMessage);
            log.info("Broadcasted REFRESH_BUGS WebSocket event for Project ID: {}", projectId);
        } catch (Exception e) {
            log.error("Failed to broadcast REFRESH_BUGS event for Project ID: {}", projectId, e);
        }
    }
}
