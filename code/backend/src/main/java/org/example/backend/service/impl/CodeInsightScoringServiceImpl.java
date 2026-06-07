package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.GitHubCheckRunRepository;
import org.example.backend.repository.GitHubCommitRepository;
import org.example.backend.repository.GitHubPullRequestRepository;
import org.example.backend.repository.ProjectCodeInsightSettingsRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.CodeInsightScoringService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CodeInsightScoringServiceImpl implements CodeInsightScoringService {

    private final TaskRepository taskRepository;
    private final ProjectCodeInsightSettingsRepository codeInsightSettingsRepository;
    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final GitHubCommitRepository commitRepository;
    private final GitHubPullRequestRepository pullRequestRepository;
    private final GitHubCheckRunRepository checkRunRepository;

    @Override
    @Transactional(readOnly = true)
    public TaskReviewDecisionResponse.ReviewEvidenceSummary buildReviewEvidenceSummary(Task task) {
        int score = 100;
        List<String> positiveSignals = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> scoreBreakdown = new ArrayList<>();

        boolean hasGithubIssue = task.getGithubIssueNumber() != null || hasText(task.getGithubIssueUrl());
        boolean hasRequirement = task.getRequirementId() != null;
        List<TaskChecklist> checklist = task.getChecklist() != null ? task.getChecklist() : Collections.emptyList();
        List<Task> subTasks = task.getId() != null ? taskRepository.findByParentId(task.getId()) : Collections.emptyList();
        List<CodeInsightEvidenceLink> evidenceLinks = task.getId() != null
                ? evidenceLinkRepository.findByTaskId(task.getId())
                : Collections.emptyList();

        int checklistTotal = checklist.size();
        int checklistDone = (int) checklist.stream().filter(TaskChecklist::isDone).count();
        int subtaskTotal = subTasks.size();
        int subtaskDone = (int) subTasks.stream().filter(subTask -> subTask.getStatus() == TaskStatus.DONE).count();

        score = applyLocalSignals(task, score, positiveSignals, warnings, scoreBreakdown,
                hasGithubIssue, hasRequirement, checklistTotal, checklistDone, subtaskTotal, subtaskDone);

        EvidenceStats evidenceStats = buildEvidenceStats(evidenceLinks);
        score = applyGithubSignals(task, score, positiveSignals, warnings, scoreBreakdown, evidenceStats);

        int threshold = task.getProject() != null
                ? codeInsightSettingsRepository.findByProjectId(task.getProject().getId())
                        .map(ProjectCodeInsightSettings::getMinScoreWarningThreshold)
                        .orElse(70)
                : 70;
        int clampedScore = Math.max(0, Math.min(100, score));
        String riskLevel = resolveRiskLevel(clampedScore, threshold, evidenceStats);
        String evidenceMode = evidenceStats.hasCodeEvidence()
                ? "GITHUB_CODE_LINKED"
                : hasGithubIssue ? "GITHUB_ISSUE_LINKED" : "MANUAL_GATE";

        return TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .score(clampedScore)
                .riskLevel(riskLevel)
                .evidenceMode(evidenceMode)
                .hasGithubIssue(hasGithubIssue)
                .hasRequirement(hasRequirement)
                .checklistTotal(checklistTotal)
                .checklistDone(checklistDone)
                .subtaskTotal(subtaskTotal)
                .subtaskDone(subtaskDone)
                .commitCount(evidenceStats.commitCount())
                .pullRequestCount(evidenceStats.pullRequestCount())
                .checkRunCount(evidenceStats.checkRunCount())
                .ciStatus(evidenceStats.ciStatus())
                .hasMergedPullRequest(evidenceStats.hasMergedPullRequest())
                .scoreBreakdown(scoreBreakdown)
                .positiveSignals(positiveSignals)
                .warnings(warnings)
                .build();
    }

    private int applyLocalSignals(
            Task task,
            int score,
            List<String> positiveSignals,
            List<String> warnings,
            List<String> scoreBreakdown,
            boolean hasGithubIssue,
            boolean hasRequirement,
            int checklistTotal,
            int checklistDone,
            int subtaskTotal,
            int subtaskDone) {
        if (hasRequirement) {
            positiveSignals.add("Requirement linked");
        } else {
            score -= 15;
            warnings.add("No requirement linked");
            scoreBreakdown.add("-15 No requirement linked");
        }

        if (task.getPrimaryAssignee() != null) {
            positiveSignals.add("Assignee available");
        } else {
            score -= 10;
            warnings.add("Task has no assignee");
            scoreBreakdown.add("-10 Task has no assignee");
        }

        if (hasGithubIssue) {
            positiveSignals.add("GitHub issue linked");
        } else {
            score -= 20;
            warnings.add("No GitHub issue evidence yet");
            scoreBreakdown.add("-20 No GitHub issue evidence yet");
        }

        if (checklistTotal > 0 && checklistDone < checklistTotal) {
            score -= 20;
            warnings.add("Checklist is not fully completed");
            scoreBreakdown.add("-20 Checklist is not fully completed");
        } else if (checklistTotal > 0) {
            positiveSignals.add("Checklist completed");
        }

        if (subtaskTotal > 0 && subtaskDone < subtaskTotal) {
            score -= 25;
            warnings.add("Subtasks are not fully completed");
            scoreBreakdown.add("-25 Subtasks are not fully completed");
        } else if (subtaskTotal > 0) {
            positiveSignals.add("Subtasks completed");
        }

        if (task.getStatus() == TaskStatus.BLOCKED) {
            score -= 25;
            warnings.add("Task is blocked");
            scoreBreakdown.add("-25 Task is blocked");
        }
        return score;
    }

    private int applyGithubSignals(
            Task task,
            int score,
            List<String> positiveSignals,
            List<String> warnings,
            List<String> scoreBreakdown,
            EvidenceStats evidenceStats) {
        if (evidenceStats.commitCount() > 0) {
            positiveSignals.add("Linked commit evidence found");
        } else {
            score -= 20;
            warnings.add("No linked commit evidence");
            scoreBreakdown.add("-20 No linked commit evidence");
        }

        if (evidenceStats.pullRequestCount() > 0) {
            positiveSignals.add("Linked pull request evidence found");
        } else {
            score -= 20;
            warnings.add("No linked pull request evidence");
            scoreBreakdown.add("-20 No linked pull request evidence");
        }

        if (evidenceStats.hasMergedPullRequest()) {
            positiveSignals.add("Pull request merged");
        }

        if (evidenceStats.hasDraftPullRequest()) {
            score -= 15;
            warnings.add("Linked pull request is still draft");
            scoreBreakdown.add("-15 Linked pull request is still draft");
        }

        if ("FAILED".equals(evidenceStats.ciStatus())) {
            score -= 25;
            warnings.add("Linked CI/check failed");
            scoreBreakdown.add("-25 Linked CI/check failed");
        } else if ("PASSED".equals(evidenceStats.ciStatus())) {
            positiveSignals.add("Linked CI/check passed");
        } else if (evidenceStats.hasCodeEvidence()) {
            warnings.add("No passing CI/check evidence yet");
        }

        if (evidenceStats.hasAuthorEvidence() && task.getPrimaryAssignee() != null) {
            if (evidenceStats.authorMatches(task.getPrimaryAssignee())) {
                positiveSignals.add("GitHub author matches assignee");
            } else {
                score -= 10;
                warnings.add("GitHub author does not match assignee");
                scoreBreakdown.add("-10 GitHub author does not match assignee");
            }
        }

        return score;
    }

    private EvidenceStats buildEvidenceStats(List<CodeInsightEvidenceLink> evidenceLinks) {
        List<Long> commitIds = evidenceIds(evidenceLinks, CodeInsightEvidenceType.COMMIT);
        List<Long> pullRequestIds = evidenceIds(evidenceLinks, CodeInsightEvidenceType.PULL_REQUEST);
        List<Long> checkRunIds = evidenceIds(evidenceLinks, CodeInsightEvidenceType.CHECK_RUN);

        List<GitHubCommit> commits = commitIds.isEmpty() ? Collections.emptyList() : commitRepository.findAllById(commitIds);
        List<GitHubPullRequest> pullRequests = pullRequestIds.isEmpty() ? Collections.emptyList() : pullRequestRepository.findAllById(pullRequestIds);
        List<GitHubCheckRun> checkRuns = checkRunIds.isEmpty() ? Collections.emptyList() : checkRunRepository.findAllById(checkRunIds);

        boolean hasMergedPullRequest = pullRequests.stream().anyMatch(pr -> pr.getMergedAt() != null);
        boolean hasDraftPullRequest = pullRequests.stream().anyMatch(GitHubPullRequest::isDraft);
        String ciStatus = resolveCiStatus(checkRuns, pullRequests, commits);

        Set<String> authorEmails = commits.stream()
                .map(GitHubCommit::getAuthorEmail)
                .filter(this::hasText)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        Set<String> authorLogins = new HashSet<>();
        commits.stream().map(GitHubCommit::getAuthorLogin).filter(this::hasText)
                .map(value -> value.toLowerCase(Locale.ROOT)).forEach(authorLogins::add);
        pullRequests.stream().map(GitHubPullRequest::getAuthorLogin).filter(this::hasText)
                .map(value -> value.toLowerCase(Locale.ROOT)).forEach(authorLogins::add);

        return new EvidenceStats(
                commitIds.size(),
                pullRequestIds.size(),
                checkRunIds.size(),
                ciStatus,
                hasMergedPullRequest,
                hasDraftPullRequest,
                authorEmails,
                authorLogins);
    }

    private List<Long> evidenceIds(List<CodeInsightEvidenceLink> evidenceLinks, CodeInsightEvidenceType evidenceType) {
        return evidenceLinks.stream()
                .filter(link -> link.getEvidenceType() == evidenceType)
                .map(CodeInsightEvidenceLink::getEvidenceId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private String resolveCiStatus(
            List<GitHubCheckRun> checkRuns,
            List<GitHubPullRequest> pullRequests,
            List<GitHubCommit> commits) {
        if (checkRuns.isEmpty()) return "NO_CI";
        List<GitHubCheckRun> currentCheckRuns = currentShaCheckRuns(checkRuns, pullRequests, commits);
        if (currentCheckRuns.stream().anyMatch(this::isFailedCheck)) return "FAILED";
        if (currentCheckRuns.stream().anyMatch(this::isPassedCheck)) return "PASSED";
        return "PENDING";
    }

    private List<GitHubCheckRun> currentShaCheckRuns(
            List<GitHubCheckRun> checkRuns,
            List<GitHubPullRequest> pullRequests,
            List<GitHubCommit> commits) {
        Set<String> currentShas = pullRequests.stream()
                .map(GitHubPullRequest::getHeadSha)
                .filter(this::hasText)
                .map(this::normalizeSha)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (currentShas.isEmpty()) {
            latestCommitSha(commits).ifPresent(currentShas::add);
        }

        if (currentShas.isEmpty()) {
            return checkRuns;
        }

        List<GitHubCheckRun> scopedRuns = checkRuns.stream()
                .filter(checkRun -> currentShas.contains(normalizeSha(checkRun.getSha())))
                .toList();
        return scopedRuns.isEmpty() ? checkRuns : scopedRuns;
    }

    private Optional<String> latestCommitSha(List<GitHubCommit> commits) {
        return commits.stream()
                .filter(commit -> hasText(commit.getSha()))
                .max(Comparator
                        .comparing(GitHubCommit::getCommittedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(GitHubCommit::getUpdatedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(GitHubCommit::getId, Comparator.nullsFirst(Comparator.naturalOrder())))
                .map(GitHubCommit::getSha)
                .map(this::normalizeSha);
    }

    private String resolveRiskLevel(int clampedScore, int threshold, EvidenceStats evidenceStats) {
        // Failed CI is a hard review gate; it must not appear READY even when other evidence is strong.
        if ("FAILED".equals(evidenceStats.ciStatus())) {
            return "BLOCKED";
        }
        if (clampedScore < 50) {
            return "BLOCKED";
        }
        if (clampedScore < threshold) {
            return "WARNING";
        }
        return "READY";
    }

    private boolean isPassedCheck(GitHubCheckRun checkRun) {
        return "success".equalsIgnoreCase(checkRun.getConclusion());
    }

    private boolean isFailedCheck(GitHubCheckRun checkRun) {
        String conclusion = checkRun.getConclusion();
        return "failure".equalsIgnoreCase(conclusion)
                || "failed".equalsIgnoreCase(conclusion)
                || "cancelled".equalsIgnoreCase(conclusion)
                || "timed_out".equalsIgnoreCase(conclusion)
                || "action_required".equalsIgnoreCase(conclusion);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String normalizeSha(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private record EvidenceStats(
            int commitCount,
            int pullRequestCount,
            int checkRunCount,
            String ciStatus,
            boolean hasMergedPullRequest,
            boolean hasDraftPullRequest,
            Set<String> authorEmails,
            Set<String> authorLogins) {

        boolean hasCodeEvidence() {
            return commitCount > 0 || pullRequestCount > 0 || checkRunCount > 0;
        }

        boolean hasAuthorEvidence() {
            return !authorEmails.isEmpty() || !authorLogins.isEmpty();
        }

        boolean authorMatches(UserAccount assignee) {
            if (assignee == null) return false;
            String email = assignee.getEmail() != null ? assignee.getEmail().toLowerCase(Locale.ROOT) : null;
            String username = assignee.getUsername() != null ? assignee.getUsername().toLowerCase(Locale.ROOT) : null;
            return (email != null && authorEmails.contains(email))
                    || (username != null && authorLogins.contains(username));
        }
    }
}
