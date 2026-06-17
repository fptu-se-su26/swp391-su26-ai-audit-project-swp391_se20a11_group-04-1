package org.example.backend.service.github.issue;

import org.example.backend.entity.BugReport;
import org.example.backend.entity.Task;

public interface GitHubIssueSyncService {
    void createGitHubIssue(BugReport bugReport, Long userId);

    void createGitHubIssueForTask(Task task, Long userId);

    void updateGitHubIssueStatus(BugReport bugReport, Long userId);

    void updateGitHubIssueStatusForTask(Task task, Long userId);
}
