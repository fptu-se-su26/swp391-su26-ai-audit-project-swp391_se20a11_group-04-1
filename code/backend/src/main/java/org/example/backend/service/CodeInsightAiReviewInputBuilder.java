package org.example.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightAiReviewInput;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class CodeInsightAiReviewInputBuilder {
    public static final int MAX_PRS = 5;
    public static final int MAX_COMMITS = 20;
    public static final int MAX_CHECKS = 20;
    public static final int MAX_FILES = 10;
    public static final int MAX_PATCH_CHARS_PER_FILE = 6000;
    public static final int MAX_TOTAL_PATCH_CHARS = 30000;
    public static final int MAX_CHECKLIST = 30;
    public static final int MAX_SUBTASKS = 20;
    public static final int MAX_ACCEPTANCE_CRITERIA = 20;

    private static final Set<String> BINARY_EXTENSIONS = Set.of(
            ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".jar", ".class");
    private static final Set<String> SENSITIVE_FILE_NAMES = Set.of(
            ".env", ".env.local", ".env.development", ".env.production", ".npmrc", ".pypirc", ".netrc");
    private static final Set<String> SENSITIVE_EXTENSIONS = Set.of(
            ".pem", ".key", ".p12", ".pfx", ".jks", ".keystore", ".crt", ".cer");
    private static final Pattern PRIVATE_KEY_PATTERN = Pattern.compile(
            "-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\\s\\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----");
    private static final Pattern ASSIGNMENT_SECRET_PATTERN = Pattern.compile(
            "(?i)((?:^|[+\\-\\s])(?:api[_-]?key|access[_-]?token|auth[_-]?token|refresh[_-]?token|client[_-]?secret|token|secret|password|passwd|pwd|private[_-]?key)\\s*[:=]\\s*)([^\\s\"']+)");
    private static final Pattern JSON_SECRET_PATTERN = Pattern.compile(
            "(?i)(\"(?:api[_-]?key|access[_-]?token|auth[_-]?token|refresh[_-]?token|client[_-]?secret|secret|password|private[_-]?key)\"\\s*:\\s*\")([^\"]+)(\")");
    private static final Pattern URI_SECRET_PATTERN = Pattern.compile(
            "(?i)((?:postgres|postgresql|mysql|mongodb|redis|amqp|jdbc:[a-z]+)://[^\\s:@/]+:)([^\\s@]+)(@)");

    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final GitHubPullRequestRepository pullRequestRepository;
    private final GitHubCommitRepository commitRepository;
    private final GitHubCheckRunRepository checkRunRepository;
    private final GitHubPullRequestFileRepository pullRequestFileRepository;
    private final RequirementRepository requirementRepository;
    private final ObjectMapper objectMapper;

    public CodeInsightAiReviewInput build(Task task, TaskReviewDecisionResponse.ReviewEvidenceSummary score) {
        List<CodeInsightEvidenceLink> links = evidenceLinkRepository.findByTaskId(task.getId());
        List<Long> prIds = evidenceIds(links, CodeInsightEvidenceType.PULL_REQUEST, MAX_PRS);
        List<Long> commitIds = evidenceIds(links, CodeInsightEvidenceType.COMMIT, MAX_COMMITS);
        List<Long> checkIds = evidenceIds(links, CodeInsightEvidenceType.CHECK_RUN, MAX_CHECKS);

        List<GitHubPullRequest> pullRequests = prIds.isEmpty() ? List.of() : pullRequestRepository.findAllById(prIds);
        List<GitHubCommit> commits = commitIds.isEmpty() ? List.of() : commitRepository.findAllById(commitIds);
        List<GitHubCheckRun> checks = checkIds.isEmpty() ? List.of() : checkRunRepository.findAllById(checkIds);
        List<GitHubPullRequestFile> files = prIds.isEmpty()
                ? List.of()
                : pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(prIds);

        return CodeInsightAiReviewInput.builder()
                .reviewContext(CodeInsightAiReviewInput.ReviewContext.builder()
                        .projectId(task.getProject() != null ? task.getProject().getId() : null)
                        .taskId(task.getId())
                        .generatedAt(LocalDateTime.now())
                        .reviewPurpose("leader_task_review")
                        .language("en")
                        .build())
                .task(buildTask(task))
                .requirement(buildRequirement(task))
                .ruleScore(buildRuleScore(score))
                .githubEvidence(buildGitHubEvidence(task, pullRequests, commits, checks))
                .changedFiles(buildChangedFiles(files))
                .limits(CodeInsightAiReviewInput.LimitsInput.builder()
                        .maxFilesSent(MAX_FILES)
                        .maxPatchCharsPerFile(MAX_PATCH_CHARS_PER_FILE)
                        .maxTotalPatchChars(MAX_TOTAL_PATCH_CHARS)
                        .binaryFilesExcluded(true)
                        .secretsRedacted(true)
                        .build())
                .build();
    }

    private CodeInsightAiReviewInput.TaskInput buildTask(Task task) {
        UserAccount assignee = task.getPrimaryAssignee();
        return CodeInsightAiReviewInput.TaskInput.builder()
                .id(task.getId())
                .code(task.getTaskCode())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus() != null ? task.getStatus().name() : null)
                .type(task.getType() != null ? task.getType().name() : null)
                .priority(task.getPriority() != null ? task.getPriority().name() : null)
                .assignee(assignee == null ? null : CodeInsightAiReviewInput.AssigneeInput.builder()
                        .id(assignee.getId())
                        .username(assignee.getUsername())
                        .email(assignee.getEmail())
                        .build())
                .checklist(task.getChecklist().stream()
                        .sorted(Comparator.comparingInt(TaskChecklist::getOrderIndex))
                        .limit(MAX_CHECKLIST)
                        .map(item -> CodeInsightAiReviewInput.ChecklistInput.builder()
                                .content(item.getContent())
                                .done(item.isDone())
                                .build())
                        .toList())
                .subtasks(task.getSubTasks().stream()
                        .limit(MAX_SUBTASKS)
                        .map(subtask -> CodeInsightAiReviewInput.SubtaskInput.builder()
                                .id(subtask.getId())
                                .title(subtask.getTitle())
                                .status(subtask.getStatus() != null ? subtask.getStatus().name() : null)
                                .build())
                        .toList())
                .build();
    }

    private CodeInsightAiReviewInput.RequirementInput buildRequirement(Task task) {
        if (task.getRequirementId() == null || task.getProject() == null) return null;
        return requirementRepository.findById(task.getRequirementId())
                .filter(requirement -> requirement.getProject() != null && task.getProject().getId().equals(requirement.getProject().getId()))
                .map(requirement -> CodeInsightAiReviewInput.RequirementInput.builder()
                        .id(requirement.getId())
                        .code(requirement.getReqCode())
                        .title(requirement.getTitle())
                        .description(requirement.getDescription())
                        .acceptanceCriteria(readStringList(requirement.getAcceptanceCriteria()).stream()
                                .limit(MAX_ACCEPTANCE_CRITERIA)
                                .toList())
                        .build())
                .orElse(null);
    }

    private CodeInsightAiReviewInput.RuleScoreInput buildRuleScore(TaskReviewDecisionResponse.ReviewEvidenceSummary score) {
        return CodeInsightAiReviewInput.RuleScoreInput.builder()
                .score(score.getScore())
                .riskLevel(score.getRiskLevel())
                .ciStatus(score.getCiStatus())
                .warnings(score.getWarnings() != null ? score.getWarnings() : List.of())
                .positiveSignals(score.getPositiveSignals() != null ? score.getPositiveSignals() : List.of())
                .scoreBreakdown(score.getScoreBreakdown() != null ? score.getScoreBreakdown() : List.of())
                .build();
    }

    private CodeInsightAiReviewInput.GitHubEvidenceInput buildGitHubEvidence(
            Task task,
            List<GitHubPullRequest> pullRequests,
            List<GitHubCommit> commits,
            List<GitHubCheckRun> checks) {
        return CodeInsightAiReviewInput.GitHubEvidenceInput.builder()
                .issue(task.getGithubIssueNumber() == null && task.getGithubIssueUrl() == null ? null : CodeInsightAiReviewInput.IssueInput.builder()
                        .number(task.getGithubIssueNumber())
                        .url(task.getGithubIssueUrl())
                        .build())
                .pullRequests(pullRequests.stream().limit(MAX_PRS).map(pr -> CodeInsightAiReviewInput.PullRequestInput.builder()
                        .id(pr.getId())
                        .number(pr.getPrNumber())
                        .title(pr.getTitle())
                        .state(pr.getState())
                        .headBranch(pr.getHeadBranch())
                        .headSha(pr.getHeadSha())
                        .merged(pr.getMergedAt() != null)
                        .authorLogin(pr.getAuthorLogin())
                        .url(pr.getUrl())
                        .build()).toList())
                .commits(commits.stream().limit(MAX_COMMITS).map(commit -> CodeInsightAiReviewInput.CommitInput.builder()
                        .id(commit.getId())
                        .sha(commit.getSha())
                        .message(commit.getMessage())
                        .branchName(commit.getBranchName())
                        .authorLogin(commit.getAuthorLogin())
                        .authorEmail(commit.getAuthorEmail())
                        .build()).toList())
                .checks(checks.stream().limit(MAX_CHECKS).map(check -> CodeInsightAiReviewInput.CheckInput.builder()
                        .id(check.getId())
                        .name(check.getName())
                        .eventType(check.getEventType())
                        .status(check.getStatus())
                        .conclusion(check.getConclusion())
                        .sha(check.getSha())
                        .build()).toList())
                .build();
    }

    private List<CodeInsightAiReviewInput.ChangedFileInput> buildChangedFiles(List<GitHubPullRequestFile> files) {
        int[] totalPatchChars = {0};
        return files.stream().limit(MAX_FILES).map(file -> {
            String patch = file.getPatchSummary();
            boolean binary = isBinary(file.getFilePath());
            boolean sensitiveFile = isSensitiveFile(file.getFilePath());
            boolean truncated = false;
            boolean secretsRedacted = false;
            String excludedReason = null;
            if (binary) {
                patch = null;
                excludedReason = "BINARY_FILE";
            } else if (sensitiveFile) {
                patch = null;
                secretsRedacted = true;
                excludedReason = "SENSITIVE_FILE";
            } else if (patch != null) {
                int remaining = Math.max(0, MAX_TOTAL_PATCH_CHARS - totalPatchChars[0]);
                int allowed = Math.min(MAX_PATCH_CHARS_PER_FILE, remaining);
                if (patch.length() > allowed) {
                    patch = patch.substring(0, allowed);
                    truncated = true;
                }
                RedactionResult redaction = redactSecrets(patch);
                patch = redaction.value();
                secretsRedacted = redaction.redacted();
                totalPatchChars[0] += patch.length();
            }
            return CodeInsightAiReviewInput.ChangedFileInput.builder()
                    .file(file.getFilePath())
                    .status(file.getStatus())
                    .additions(file.getAdditions())
                    .deletions(file.getDeletions())
                    .changes(file.getChanges())
                    .patch(patch)
                    .binary(binary)
                    .patchTruncated(truncated)
                    .secretsRedacted(secretsRedacted)
                    .patchExcludedReason(excludedReason)
                    .build();
        }).toList();
    }

    private List<Long> evidenceIds(List<CodeInsightEvidenceLink> links, CodeInsightEvidenceType type, int limit) {
        return links.stream()
                .filter(link -> link.getEvidenceType() == type)
                .map(CodeInsightEvidenceLink::getEvidenceId)
                .distinct()
                .limit(limit)
                .toList();
    }

    private boolean isBinary(String filePath) {
        if (filePath == null) return false;
        String lower = filePath.toLowerCase();
        return BINARY_EXTENSIONS.stream().anyMatch(lower::endsWith);
    }

    private boolean isSensitiveFile(String filePath) {
        if (filePath == null) return false;
        String normalized = filePath.replace('\\', '/').toLowerCase();
        String fileName = normalized.substring(normalized.lastIndexOf('/') + 1);
        return SENSITIVE_FILE_NAMES.contains(fileName)
                || SENSITIVE_EXTENSIONS.stream().anyMatch(normalized::endsWith)
                || fileName.contains("secret")
                || fileName.contains("credential");
    }

    private RedactionResult redactSecrets(String value) {
        if (value == null) return new RedactionResult(null, false);
        String redacted = PRIVATE_KEY_PATTERN.matcher(value).replaceAll("[REDACTED_PRIVATE_KEY]");
        redacted = ASSIGNMENT_SECRET_PATTERN.matcher(redacted).replaceAll("$1[REDACTED]");
        redacted = JSON_SECRET_PATTERN.matcher(redacted).replaceAll("$1[REDACTED]$3");
        redacted = URI_SECRET_PATTERN.matcher(redacted).replaceAll("$1[REDACTED]$3");
        return new RedactionResult(redacted, !redacted.equals(value));
    }

    private record RedactionResult(String value, boolean redacted) {}

    private List<String> readStringList(String json) {
        try {
            return json != null ? objectMapper.readValue(json, new TypeReference<List<String>>() {}) : List.of();
        } catch (Exception ex) {
            return List.of();
        }
    }
}
