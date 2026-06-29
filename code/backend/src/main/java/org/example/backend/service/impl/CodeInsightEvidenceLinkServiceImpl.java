package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.*;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.GitHubCommitRepository;
import org.example.backend.repository.GitHubPullRequestRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.CodeInsightEvidenceLinkService;
import org.example.backend.service.WebSocketBroadcastService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CodeInsightEvidenceLinkServiceImpl implements CodeInsightEvidenceLinkService {

    private static final Pattern TASK_REF_PATTERN = Pattern.compile("\\b(?:TASK|TSK)[-_ ]?0*(\\d+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ISSUE_REF_PATTERN = Pattern.compile("(?<![A-Za-z0-9])#(\\d+)\\b");

    private final CodeInsightEvidenceLinkRepository linkRepository;
    private final TaskRepository taskRepository;
    private final GitHubCommitRepository commitRepository;
    private final GitHubPullRequestRepository pullRequestRepository;
    private final WebSocketBroadcastService webSocketBroadcastService;

    @Override
    @Transactional
    public void linkCommit(GitHubCommit commit) {
        if (commit == null || commit.getId() == null || commit.getProject() == null) return;

        Long projectId = commit.getProject().getId();
        Map<Long, LinkCandidate> candidates = new LinkedHashMap<>();
        collectTaskRefs(projectId, commit.getBranchName(), CodeInsightEvidenceLinkSource.BRANCH_NAME,
                "Task key found in commit branch", candidates);
        collectTaskRefs(projectId, commit.getMessage(), CodeInsightEvidenceLinkSource.COMMIT_MESSAGE,
                "Task key found in commit message", candidates);
        collectIssueRefs(projectId, commit.getMessage(), "GitHub issue number found in commit message", candidates);

        candidates.values().forEach(candidate -> saveLink(
                commit.getProject(),
                candidate.task(),
                CodeInsightEvidenceType.COMMIT,
                commit.getId(),
                candidate.source(),
                candidate.reason()));
    }

    @Override
    @Transactional
    public void linkPullRequest(GitHubPullRequest pullRequest) {
        if (pullRequest == null || pullRequest.getId() == null || pullRequest.getProject() == null) return;

        Long projectId = pullRequest.getProject().getId();
        Map<Long, LinkCandidate> candidates = new LinkedHashMap<>();
        collectTaskRefs(projectId, pullRequest.getHeadBranch(), CodeInsightEvidenceLinkSource.BRANCH_NAME,
                "Task key found in PR branch", candidates);
        collectTaskRefs(projectId, pullRequest.getTitle(), CodeInsightEvidenceLinkSource.PR_TITLE,
                "Task key found in PR title", candidates);
        collectTaskRefs(projectId, pullRequest.getBody(), CodeInsightEvidenceLinkSource.PR_BODY,
                "Task key found in PR body", candidates);
        collectIssueRefs(projectId, pullRequest.getTitle(), "GitHub issue number found in PR title", candidates);
        collectIssueRefs(projectId, pullRequest.getBody(), "GitHub issue number found in PR body", candidates);

        candidates.values().forEach(candidate -> saveLink(
                pullRequest.getProject(),
                candidate.task(),
                CodeInsightEvidenceType.PULL_REQUEST,
                pullRequest.getId(),
                candidate.source(),
                candidate.reason()));
    }

    @Override
    @Transactional
    public void linkCheckRun(GitHubCheckRun checkRun) {
        if (checkRun == null || checkRun.getId() == null || checkRun.getProject() == null || !hasText(checkRun.getSha())) return;

        Long projectId = checkRun.getProject().getId();
        Set<Long> linkedTaskIds = new HashSet<>();

        commitRepository.findByProjectIdAndSha(projectId, checkRun.getSha())
                .ifPresent(commit -> copyExistingLinks(
                        checkRun.getProject(),
                        checkRun.getId(),
                        CodeInsightEvidenceType.COMMIT,
                        commit.getId(),
                        linkedTaskIds));

        pullRequestRepository
                .findFirstByProjectIdAndHeadShaOrProjectIdAndMergeCommitSha(projectId, checkRun.getSha(), projectId, checkRun.getSha())
                .ifPresent(pullRequest -> copyExistingLinks(
                        checkRun.getProject(),
                        checkRun.getId(),
                        CodeInsightEvidenceType.PULL_REQUEST,
                        pullRequest.getId(),
                        linkedTaskIds));
    }

    private void collectTaskRefs(
            Long projectId,
            String text,
            CodeInsightEvidenceLinkSource source,
            String reason,
            Map<Long, LinkCandidate> candidates) {
        if (!hasText(text)) return;

        Matcher matcher = TASK_REF_PATTERN.matcher(text);
        while (matcher.find()) {
            String rawNumber = matcher.group(1);
            resolveTask(projectId, rawNumber).ifPresent(task ->
                    candidates.putIfAbsent(task.getId(), new LinkCandidate(task, source, reason + ": " + matcher.group())));
        }
    }

    private void collectIssueRefs(Long projectId, String text, String reason, Map<Long, LinkCandidate> candidates) {
        if (!hasText(text)) return;

        Matcher matcher = ISSUE_REF_PATTERN.matcher(text);
        while (matcher.find()) {
            Integer issueNumber = parseInt(matcher.group(1));
            if (issueNumber == null) continue;
            taskRepository.findByProjectIdAndGithubIssueNumber(projectId, issueNumber)
                    .forEach(task -> candidates.putIfAbsent(task.getId(), new LinkCandidate(
                            task,
                            CodeInsightEvidenceLinkSource.GITHUB_ISSUE_NUMBER,
                            reason + ": #" + issueNumber)));
        }
    }

    private Optional<Task> resolveTask(Long projectId, String rawNumber) {
        Integer projectNumber = parseInt(rawNumber);
        if (projectNumber == null) return Optional.empty();

        for (String code : taskCodeCandidates(projectNumber)) {
            Optional<Task> byCode = taskRepository.findByProjectIdAndTaskCodeIgnoreCase(projectId, code);
            if (byCode.isPresent()) return byCode;
        }

        Optional<Task> byProjectSubId = taskRepository.findByProjectIdAndProjectSubId(projectId, projectNumber);
        if (byProjectSubId.isPresent()) return byProjectSubId;

        return taskRepository.findByProjectIdAndId(projectId, projectNumber.longValue());
    }

    private List<String> taskCodeCandidates(Integer number) {
        String plain = String.valueOf(number);
        String twoDigit = String.format("%02d", number);
        String threeDigit = String.format("%03d", number);
        return List.of(
                "TASK-" + plain,
                "TSK-" + plain,
                "TASK-" + twoDigit,
                "TSK-" + twoDigit,
                "TASK-" + threeDigit,
                "TSK-" + threeDigit);
    }

    private void copyExistingLinks(
            Project project,
            Long checkRunId,
            CodeInsightEvidenceType sourceEvidenceType,
            Long sourceEvidenceId,
            Set<Long> linkedTaskIds) {
        linkRepository.findByProjectIdAndEvidenceTypeAndEvidenceId(project.getId(), sourceEvidenceType, sourceEvidenceId)
                .forEach(existing -> {
                    if (linkedTaskIds.add(existing.getTask().getId())) {
                        saveLink(
                                project,
                                existing.getTask(),
                                CodeInsightEvidenceType.CHECK_RUN,
                                checkRunId,
                                CodeInsightEvidenceLinkSource.SHA_CHAIN,
                                "Check run SHA matched linked " + sourceEvidenceType.name().toLowerCase(Locale.ROOT));
                    }
                });
    }

    private void saveLink(
            Project project,
            Task task,
            CodeInsightEvidenceType evidenceType,
            Long evidenceId,
            CodeInsightEvidenceLinkSource source,
            String reason) {
        if (project == null || task == null || evidenceId == null || task.getProject() == null) return;
        if (!Objects.equals(project.getId(), task.getProject().getId())) return;
        if (linkRepository.existsByProjectIdAndTaskIdAndEvidenceTypeAndEvidenceId(
                project.getId(), task.getId(), evidenceType, evidenceId)) {
            return;
        }

        linkRepository.save(CodeInsightEvidenceLink.builder()
                .project(project)
                .task(task)
                .evidenceType(evidenceType)
                .evidenceId(evidenceId)
                .source(source)
                .confidence(CodeInsightEvidenceConfidence.HIGH)
                .reason(reason)
                .build());

        // Broadcast to WebSocket to let client know a new evidence link has been created
        webSocketBroadcastService.broadcastEvidenceLinked(project.getId(), task.getId(), evidenceType.name(), source.name());
    }

    private Integer parseInt(String value) {
        if (!hasText(value)) return null;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private record LinkCandidate(Task task, CodeInsightEvidenceLinkSource source, String reason) {
    }
}
