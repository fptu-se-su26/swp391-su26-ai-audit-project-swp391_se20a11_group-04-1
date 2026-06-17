package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.dto.CodeInsightApprovalGateResponse;
import org.example.backend.dto.TaskReviewDashboardResponse;
import org.example.backend.dto.TaskReviewDetailResponse;
import org.example.backend.dto.TaskEvidenceResponse;
import org.example.backend.dto.ManualEvidenceLinkResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.ManualEvidenceLinkRepository;
import org.example.backend.repository.GitHubWebhookEventRepository;
import org.example.backend.repository.GitHubCheckRunRepository;
import org.example.backend.repository.GitHubCommitRepository;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.repository.GitHubPullRequestFileRepository;
import org.example.backend.repository.GitHubPullRequestRepository;
import org.example.backend.repository.ProjectCodeInsightSettingsRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskReviewDecisionRepository;
import org.example.backend.service.CodeInsightApprovalGateService;
import org.example.backend.service.ManualEvidenceLinkService;
import org.example.backend.service.CodeInsightScoringService;
import org.example.backend.service.TaskReviewService;
import org.example.backend.repository.EvidenceLinkRepository;
import org.example.backend.service.CodeInsightPatchService;
import org.example.backend.service.CodeInsightAiReviewService;
import org.springframework.http.HttpStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.repository.CodeInsightAiReviewRepository;
import org.example.backend.dto.ReqDiffAlignmentResult;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskReviewServiceImpl implements TaskReviewService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final RequirementRepository requirementRepository;
    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final ProjectCodeInsightSettingsRepository settingsRepository;
    private final TaskRepository taskRepository;
    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final ManualEvidenceLinkRepository manualEvidenceLinkRepository;
    private final GitHubCommitRepository commitRepository;
    private final GitHubPullRequestRepository pullRequestRepository;
    private final GitHubPullRequestFileRepository pullRequestFileRepository;
    private final GitHubCheckRunRepository checkRunRepository;
    private final GitHubWebhookEventRepository webhookEventRepository;
    private final TaskReviewDecisionRepository taskReviewDecisionRepository;
    private final CodeInsightScoringService scoringService;
    private final CodeInsightApprovalGateService approvalGateService;
    private final CodeInsightPatchService patchService;
    private final CodeInsightAiReviewService aiReviewService;
    private final ManualEvidenceLinkService manualEvidenceLinkService;
    private final EvidenceLinkRepository generalEvidenceLinkRepository;
    private final CodeInsightAiReviewRepository aiReviewRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public CodeInsightConfigResponse getConfig(Long projectId, Long userId) {
        // Read-only endpoint: member access is enough because no secret value is returned.
        requireProjectMember(projectId, userId);
        return toResponse(
                projectId,
                // GitHub repository config now comes from the shared GitHub Integration module.
                gitHubIntegrationRepository.findByProjectId(projectId).orElse(null),
                // If settings do not exist yet, return safe defaults without writing a row.
                settingsRepository.findByProjectId(projectId).orElse(defaultSettings(null)));
    }

    @Override
    @Transactional
    public CodeInsightConfigResponse updateConfig(Long projectId, CodeInsightConfigRequest request, Long userId) {
        // Updates are leader-only because repo config controls future trusted GitHub evidence.
        ProjectMember member = requireProjectMember(projectId, userId);
        requireProjectLeader(member);

        if (request == null) {
            throw new CustomException("Code Insight configuration is required", HttpStatus.BAD_REQUEST);
        }

        // Load the project entity to attach new config rows through a real FK relationship.
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));

        // Upsert project-level Code Insight settings first; these rules can exist even before a repo is configured.
        ProjectCodeInsightSettings settings = settingsRepository.findByProjectId(projectId)
                .orElseGet(() -> defaultSettings(project));
        applySettings(settings, request);
        settings = settingsRepository.save(settings);

        // Code Insight no longer writes repository/webhook config. That belongs to GitHub Integration.
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId).orElse(null);
        return toResponse(projectId, integration, settings);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskEvidenceResponse getTaskEvidence(Long projectId, Long taskId, Long userId) {
        requireProjectMember(projectId, userId);
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
        if (task.getProject() == null || !projectId.equals(task.getProject().getId())) {
            throw new CustomException("Task does not belong to this project", HttpStatus.BAD_REQUEST);
        }

        List<CodeInsightEvidenceLink> links = evidenceLinkRepository.findByTaskId(taskId);
        List<GitHubCommit> commits = commitRepository.findAllById(evidenceIds(links, CodeInsightEvidenceType.COMMIT));
        List<GitHubPullRequest> pullRequests = pullRequestRepository.findAllById(evidenceIds(links, CodeInsightEvidenceType.PULL_REQUEST));
        List<GitHubCheckRun> checkRuns = checkRunRepository.findAllById(evidenceIds(links, CodeInsightEvidenceType.CHECK_RUN));
        List<GitHubPullRequestFile> changedFiles = pullRequests.isEmpty()
                ? List.of()
                : pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(
                        pullRequests.stream().map(GitHubPullRequest::getId).toList());

        List<EvidenceLink> generalLinks = task.getId() != null
                ? generalEvidenceLinkRepository.findByEntityTypeAndEntityId(EvidenceEntityType.TASK, task.getId())
                : List.of();
        List<TaskEvidenceResponse.GeneralEvidenceSummary> generalEvidences = generalLinks.stream()
                .map(EvidenceLink::getEvidence)
                .filter(ev -> ev != null)
                .map(ev -> TaskEvidenceResponse.GeneralEvidenceSummary.builder()
                        .id(ev.getId())
                        .title(ev.getTitle())
                        .type(ev.getType() != null ? ev.getType().name() : null)
                        .fileUrl(ev.getFileUrl())
                        .externalUrl(ev.getExternalUrl())
                        .status(ev.getStatus() != null ? ev.getStatus().name() : null)
                        .build())
                .toList();

        return TaskEvidenceResponse.builder()
                .projectId(projectId)
                .task(toTaskSummary(task))
                .githubIssue(toGithubIssueSummary(task))
                .commits(commits.stream().map(this::toCommitEvidence).toList())
                .pullRequests(pullRequests.stream().map(this::toPullRequestEvidence).toList())
                .checkRuns(checkRuns.stream().map(this::toCheckRunEvidence).toList())
                .changedFiles(changedFiles.stream().map(this::toPullRequestFileEvidence).toList())
                .manualEvidenceLinks(manualEvidenceLinkService.list(projectId, taskId, userId))
                .aiReview(aiReviewService.getLatestReview(taskId))
                .scoreSummary(scoringService.buildReviewEvidenceSummary(task))
                .approvalGate(approvalGateService.evaluate(task))
                .generalEvidences(generalEvidences)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskReviewDetailResponse getReviewDetail(Long projectId, Long taskId, Long userId) {
        TaskEvidenceResponse evidence = getTaskEvidence(projectId, taskId, userId);
        List<TaskReviewDecisionResponse> decisions = taskReviewDecisionRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(this::toDecisionResponse)
                .toList();
        CodeInsightApprovalGateResponse gate = evidence.getApprovalGate();
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));

        List<TaskReviewDetailResponse.RequirementAcCoverageSummary> acCoverage = new java.util.ArrayList<>();
        if (task.getRequirementId() != null) {
            Requirement requirement = requirementRepository.findById(task.getRequirementId()).orElse(null);
            if (requirement != null && requirement.getAcceptanceCriteria() != null) {
                List<String> criteria = List.of();
                try {
                    criteria = objectMapper.readValue(requirement.getAcceptanceCriteria(), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
                } catch (Exception ignored) {}

                if (!criteria.isEmpty()) {
                    List<Task> siblingTasks = taskRepository.findByRequirementId(requirement.getId());
                    List<Long> doneTaskIds = siblingTasks.stream()
                            .filter(t -> t.getStatus() == org.example.backend.entity.TaskStatus.DONE)
                            .map(Task::getId)
                            .toList();

                    List<CodeInsightAiReview> approvedReviews = doneTaskIds.isEmpty() ? List.of() : aiReviewRepository.findLatestReviewsForTasks(doneTaskIds);

                    for (String ac : criteria) {
                        String finalStatus = "NOT_FOUND";
                        Long coveredByTaskId = null;
                        String coveredByTaskCode = null;

                        for (CodeInsightAiReview rev : approvedReviews) {
                            if (rev.getAlignmentResultJson() != null) {
                                try {
                                    ReqDiffAlignmentResult alignResult = objectMapper.readValue(rev.getAlignmentResultJson(), ReqDiffAlignmentResult.class);
                                    if (alignResult.getAlignmentMatrix() != null) {
                                        for (ReqDiffAlignmentResult.AlignmentItem item : alignResult.getAlignmentMatrix()) {
                                            if (ac.equals(item.getAcText())) {
                                                if ("FULLY_COVERED".equals(item.getStatus())) {
                                                    finalStatus = "FULLY_COVERED";
                                                    coveredByTaskId = rev.getTask().getId();
                                                    coveredByTaskCode = rev.getTask().getTaskCode() != null 
                                                        ? rev.getTask().getTaskCode() 
                                                        : "TSK-" + rev.getTask().getId();
                                                    break;
                                                } else if ("PARTIAL".equals(item.getStatus()) && !"FULLY_COVERED".equals(finalStatus)) {
                                                    finalStatus = "PARTIAL";
                                                    coveredByTaskId = rev.getTask().getId();
                                                    coveredByTaskCode = rev.getTask().getTaskCode() != null 
                                                        ? rev.getTask().getTaskCode() 
                                                        : "TSK-" + rev.getTask().getId();
                                                }
                                            }
                                        }
                                    }
                                } catch (Exception ignored) {}
                            }
                            if ("FULLY_COVERED".equals(finalStatus)) {
                                break;
                            }
                        }

                        acCoverage.add(TaskReviewDetailResponse.RequirementAcCoverageSummary.builder()
                                .acText(ac)
                                .status(finalStatus)
                                .coveredByTaskId(coveredByTaskId)
                                .coveredByTaskCode(coveredByTaskCode)
                                .build());
                    }
                }
            }
        }

        return TaskReviewDetailResponse.builder()
                .evidence(evidence)
                .approvalGate(gate)
                .manualEvidenceLinks(evidence.getManualEvidenceLinks())
                .decisionHistory(decisions)
                .gateResult(gate != null ? gate.getApprovalStatus() : null)
                .gateChecks(gate != null ? gate.getGateChecks() : null)
                .evidenceConfidence(gate != null ? gate.getEvidenceConfidence() : null)
                .codeRiskLevel(gate != null ? gate.getCodeRiskLevel() : null)
                .requirementAcCoverage(acCoverage)
                .build();
    }

    @Override
    @Transactional
    public TaskEvidenceResponse fetchTaskChangedFiles(Long projectId, Long taskId, Long userId) {
        requireProjectMember(projectId, userId);
        patchService.fetchChangedFiles(projectId, taskId, userId);
        return getTaskEvidence(projectId, taskId, userId);
    }

    @Override
    @Transactional
    public CodeInsightAiReviewResponse createAiReview(Long projectId, Long taskId, Long userId) {
        requireProjectMember(projectId, userId);
        return aiReviewService.createReview(projectId, taskId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskReviewDashboardResponse getDashboard(Long projectId, Long userId) {
        requireProjectMember(projectId, userId);
        List<Task> tasks = taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId);
        List<CodeInsightEvidenceLink> links = evidenceLinkRepository.findByProjectId(projectId);
        Map<Long, List<CodeInsightEvidenceLink>> linksByTask = links.stream()
                .filter(link -> link.getTask() != null)
                .collect(Collectors.groupingBy(link -> link.getTask().getId()));

        int pendingReviews = (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.IN_REVIEW).count();
        int doneWithoutEvidence = (int) tasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.DONE)
                .filter(task -> !hasCodeEvidence(linksByTask.get(task.getId())))
                .count();
        int tasksWithCiFailed = (int) tasks.stream()
                .filter(task -> "FAILED".equals(scoringService.buildReviewEvidenceSummary(task).getCiStatus()))
                .count();
        int tasksWithoutPullRequest = (int) tasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.IN_REVIEW || task.getStatus() == TaskStatus.DONE)
                .filter(task -> !hasEvidenceType(linksByTask.get(task.getId()), CodeInsightEvidenceType.PULL_REQUEST))
                .count();
        int tasksWithEvidence = (int) tasks.stream()
                .filter(task -> hasCodeEvidence(linksByTask.get(task.getId())))
                .count();
        int evidenceCoveragePercent = tasks.isEmpty() ? 0 : (int) Math.round(tasksWithEvidence * 100.0 / tasks.size());

        List<TaskReviewDashboardResponse.MemberEvidenceQuality> memberQuality = tasks.stream()
                .filter(task -> task.getPrimaryAssignee() != null)
                .collect(Collectors.groupingBy(task -> task.getPrimaryAssignee().getId()))
                .values()
                .stream()
                .map(memberTasks -> toMemberEvidenceQuality(memberTasks, linksByTask))
                .toList();

        return TaskReviewDashboardResponse.builder()
                .pendingReviews(pendingReviews)
                .doneWithoutEvidence(doneWithoutEvidence)
                .tasksWithCiFailed(tasksWithCiFailed)
                .tasksWithoutPullRequest(tasksWithoutPullRequest)
                .evidenceCoveragePercent(evidenceCoveragePercent)
                .memberEvidenceQuality(memberQuality)
                .build();
    }

    // Verify that the current session user belongs to the project before reading or writing config.
    private ProjectMember requireProjectMember(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You do not have access to this project", HttpStatus.FORBIDDEN));
    }

    // Only project leaders can change the repository and enforcement settings.
    private void requireProjectLeader(ProjectMember member) {
        String roleName = Optional.ofNullable(member.getRole())
                .map(role -> role.getName())
                .orElse("");
        String normalized = roleName.toUpperCase(Locale.ROOT).replace(" ", "_");
        if (!normalized.equals("PROJECT_LEADER") && !normalized.equals("LEADER")) {
            throw new CustomException("Only project leader can update Code Insight configuration", HttpStatus.FORBIDDEN);
        }
    }

    // Build safe default settings used before the project explicitly saves a Code Insight config row.
    private ProjectCodeInsightSettings defaultSettings(Project project) {
        return ProjectCodeInsightSettings.builder()
                .project(project)
                .reviewGateEnabled(true)
                .requirePrForDone(false)
                .requireCiPass(false)
                .aiReviewEnabled(true)
                .minScoreWarningThreshold(70)
                .blockScoreThreshold(50)
                .build();
    }

    // Apply nullable request fields so the frontend can update only part of the settings.
    private void applySettings(ProjectCodeInsightSettings settings, CodeInsightConfigRequest request) {
        if (request.getReviewGateEnabled() != null) {
            settings.setReviewGateEnabled(request.getReviewGateEnabled());
        }
        if (request.getRequirePrForDone() != null) {
            settings.setRequirePrForDone(request.getRequirePrForDone());
        }
        if (request.getRequireCiPass() != null) {
            settings.setRequireCiPass(request.getRequireCiPass());
        }
        if (request.getAiReviewEnabled() != null) {
            settings.setAiReviewEnabled(request.getAiReviewEnabled());
        }
        Integer warningThresholdInput = request.getWarningScoreThreshold() != null
                ? request.getWarningScoreThreshold()
                : request.getMinScoreWarningThreshold();
        Integer blockThresholdInput = request.getBlockScoreThreshold();
        int currentWarning = warningThresholdInput != null ? warningThresholdInput : settings.getMinScoreWarningThreshold();
        int currentBlock = blockThresholdInput != null ? blockThresholdInput : settings.getBlockScoreThreshold();
        if (currentWarning < 0 || currentWarning > 100) {
            throw new CustomException("Warning score threshold must be between 0 and 100", HttpStatus.BAD_REQUEST);
        }
        if (currentBlock < 0 || currentBlock > 100) {
            throw new CustomException("Block score threshold must be between 0 and 100", HttpStatus.BAD_REQUEST);
        }
        if (currentBlock >= currentWarning) {
            throw new CustomException("Block score threshold must be lower than warning score threshold", HttpStatus.BAD_REQUEST);
        }
        if (warningThresholdInput != null) {
            int threshold = warningThresholdInput;
            // Clamp at validation level so scoring UI always works with a predictable 0-100 range.
            settings.setMinScoreWarningThreshold(threshold);
        }
        if (blockThresholdInput != null) {
            settings.setBlockScoreThreshold(blockThresholdInput);
        }
    }

    // Merge repository config and settings into one response object for the frontend settings panel.
    private CodeInsightConfigResponse toResponse(
            Long projectId,
            GitHubIntegration integration,
            ProjectCodeInsightSettings settings) {
        return CodeInsightConfigResponse.builder()
                .projectId(projectId)
                .repository(integration != null ? toRepositoryResponse(integration) : null)
                .settings(toSettingsResponse(settings))
                .build();
    }

    // Expose shared GitHub Integration metadata while hiding encrypted token/secret values.
    private CodeInsightConfigResponse.GithubRepositoryConfig toRepositoryResponse(GitHubIntegration integration) {
        return CodeInsightConfigResponse.GithubRepositoryConfig.builder()
                .id(integration.getId())
                .repoUrl("https://github.com/" + integration.getRepoOwner() + "/" + integration.getRepoName())
                .owner(integration.getRepoOwner())
                .repoName(integration.getRepoName())
                .defaultBranch(null)
                .active(true)
                .hasWebhookSecret(hasText(integration.getWebhookSecretEncrypted()))
                .webhookUrl(integration.getWebhookUrl())
                .webhookEventsJson(integration.getWebhookEventsJson())
                .webhookLastSyncedAt(integration.getWebhookLastSyncedAt())
                .lastSyncedAt(null)
                .updatedAt(integration.getConnectedAt())
                .build();
    }

    // Convert persisted settings to the frontend-friendly settings block.
    private CodeInsightConfigResponse.CodeInsightSettings toSettingsResponse(ProjectCodeInsightSettings settings) {
        return CodeInsightConfigResponse.CodeInsightSettings.builder()
                .id(settings.getId())
                .reviewGateEnabled(settings.isReviewGateEnabled())
                .requirePrForDone(settings.isRequirePrForDone())
                .requireCiPass(settings.isRequireCiPass())
                .aiReviewEnabled(settings.isAiReviewEnabled())
                .minScoreWarningThreshold(settings.getMinScoreWarningThreshold())
                .warningScoreThreshold(settings.getMinScoreWarningThreshold())
                .blockScoreThreshold(settings.getBlockScoreThreshold())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    private List<Long> evidenceIds(List<CodeInsightEvidenceLink> links, CodeInsightEvidenceType type) {
        return links.stream()
                .filter(link -> link.getEvidenceType() == type)
                .map(CodeInsightEvidenceLink::getEvidenceId)
                .distinct()
                .toList();
    }

    private TaskEvidenceResponse.TaskSummary toTaskSummary(Task task) {
        return TaskEvidenceResponse.TaskSummary.builder()
                .id(task.getId())
                .title(task.getTitle())
                .status(task.getStatus() != null ? task.getStatus().name() : null)
                .priority(task.getPriority() != null ? task.getPriority().name() : null)
                .requirementCode(requirementCode(task))
                .assigneeName(task.getPrimaryAssignee() != null ? displayName(task.getPrimaryAssignee()) : "Unassigned")
                .build();
    }

    private String requirementCode(Task task) {
        if (task == null || task.getRequirementId() == null) return null;
        return requirementRepository.findById(task.getRequirementId())
                .map(requirement -> hasText(requirement.getReqCode())
                        ? requirement.getReqCode()
                        : "REQ-" + requirement.getId())
                .orElse(null);
    }

    private TaskEvidenceResponse.GithubIssueSummary toGithubIssueSummary(Task task) {
        if (task.getGithubIssueNumber() == null && !hasText(task.getGithubIssueUrl())) return null;
        return TaskEvidenceResponse.GithubIssueSummary.builder()
                .number(task.getGithubIssueNumber())
                .url(task.getGithubIssueUrl())
                .build();
    }

    private TaskEvidenceResponse.CommitEvidence toCommitEvidence(GitHubCommit commit) {
        return TaskEvidenceResponse.CommitEvidence.builder()
                .id(commit.getId())
                .sha(commit.getSha())
                .branchName(commit.getBranchName())
                .message(commit.getMessage())
                .authorName(commit.getAuthorName())
                .authorEmail(commit.getAuthorEmail())
                .authorLogin(commit.getAuthorLogin())
                .committedAt(commit.getCommittedAt())
                .url(commit.getUrl())
                .build();
    }

    private TaskEvidenceResponse.PullRequestEvidence toPullRequestEvidence(GitHubPullRequest pullRequest) {
        return TaskEvidenceResponse.PullRequestEvidence.builder()
                .id(pullRequest.getId())
                .prNumber(pullRequest.getPrNumber())
                .title(pullRequest.getTitle())
                .state(pullRequest.getState())
                .draft(pullRequest.isDraft())
                .authorLogin(pullRequest.getAuthorLogin())
                .headBranch(pullRequest.getHeadBranch())
                .baseBranch(pullRequest.getBaseBranch())
                .headSha(pullRequest.getHeadSha())
                .mergeCommitSha(pullRequest.getMergeCommitSha())
                .mergedAt(pullRequest.getMergedAt())
                .url(pullRequest.getUrl())
                .build();
    }

    private TaskEvidenceResponse.CheckRunEvidence toCheckRunEvidence(GitHubCheckRun checkRun) {
        return TaskEvidenceResponse.CheckRunEvidence.builder()
                .id(checkRun.getId())
                .externalId(checkRun.getExternalId())
                .sha(checkRun.getSha())
                .name(checkRun.getName())
                .eventType(checkRun.getEventType())
                .status(checkRun.getStatus())
                .conclusion(checkRun.getConclusion())
                .startedAt(checkRun.getStartedAt())
                .completedAt(checkRun.getCompletedAt())
                .url(checkRun.getUrl())
                .build();
    }

    private TaskEvidenceResponse.PullRequestFileEvidence toPullRequestFileEvidence(GitHubPullRequestFile file) {
        return TaskEvidenceResponse.PullRequestFileEvidence.builder()
                .id(file.getId())
                .pullRequestId(file.getPullRequest() != null ? file.getPullRequest().getId() : null)
                .filePath(file.getFilePath())
                .status(file.getStatus())
                .additions(file.getAdditions())
                .deletions(file.getDeletions())
                .changes(file.getChanges())
                .patchHash(file.getPatchHash())
                .patchSummary(file.getPatchSummary())
                .fetchedAt(file.getFetchedAt())
                .build();
    }

    private String displayName(UserAccount user) {
        if (user == null) return "Unassigned";
        if (user.getProfile() != null && hasText(user.getProfile().getFullName())) {
            return user.getProfile().getFullName();
        }
        return hasText(user.getUsername()) ? user.getUsername() : user.getEmail();
    }

    private TaskReviewDashboardResponse.MemberEvidenceQuality toMemberEvidenceQuality(
            List<Task> tasks,
            Map<Long, List<CodeInsightEvidenceLink>> linksByTask) {
        UserAccount member = tasks.get(0).getPrimaryAssignee();
        int tasksWithEvidence = (int) tasks.stream()
                .filter(task -> hasCodeEvidence(linksByTask.get(task.getId())))
                .count();
        int riskyTasks = (int) tasks.stream()
                .filter(task -> {
                    String riskLevel = scoringService.buildReviewEvidenceSummary(task).getRiskLevel();
                    return "WARNING".equals(riskLevel) || "BLOCKED".equals(riskLevel);
                })
                .count();
        return TaskReviewDashboardResponse.MemberEvidenceQuality.builder()
                .memberId(member.getId())
                .memberName(displayName(member))
                .taskCount(tasks.size())
                .tasksWithCodeEvidence(tasksWithEvidence)
                .riskyTasks(riskyTasks)
                .build();
    }

    private TaskReviewDecisionResponse toDecisionResponse(TaskReviewDecision decision) {
        Task task = decision.getTask();
        return TaskReviewDecisionResponse.builder()
                .id(decision.getId())
                .decision(decision.getDecision() != null ? decision.getDecision().name() : null)
                .fromStatus(decision.getFromStatus())
                .toStatus(decision.getToStatus())
                .reason(decision.getReason())
                .createdAt(decision.getCreatedAt())
                .reviewer(toReviewUserSummary(decision.getReviewer()))
                .task(task == null ? null : TaskReviewDecisionResponse.TaskSummary.builder()
                        .id(task.getId())
                        .projectId(task.getProject() != null ? task.getProject().getId() : null)
                        .title(task.getTitle())
                        .status(task.getStatus() != null ? task.getStatus().name() : null)
                        .priority(task.getPriority() != null ? task.getPriority().name() : null)
                        .type(task.getType() != null ? task.getType().name() : null)
                        .requirementCode(requirementCode(task))
                        .assigneeName(task.getPrimaryAssignee() != null ? displayName(task.getPrimaryAssignee()) : "Unassigned")
                        .evidenceSummary(scoringService.buildReviewEvidenceSummary(task))
                        .approvalGate(approvalGateService.evaluate(task))
                        .build())
                .build();
    }

    private TaskReviewDecisionResponse.UserSummary toReviewUserSummary(UserAccount user) {
        if (user == null) return null;
        return TaskReviewDecisionResponse.UserSummary.builder()
                .id(user.getId())
                .name(displayName(user))
                .email(user.getEmail())
                .build();
    }

    private boolean hasCodeEvidence(List<CodeInsightEvidenceLink> links) {
        return hasEvidenceType(links, CodeInsightEvidenceType.COMMIT)
                || hasEvidenceType(links, CodeInsightEvidenceType.PULL_REQUEST);
    }

    private boolean hasEvidenceType(List<CodeInsightEvidenceLink> links, CodeInsightEvidenceType type) {
        if (links == null || links.isEmpty()) return false;
        Set<CodeInsightEvidenceType> types = links.stream()
                .map(CodeInsightEvidenceLink::getEvidenceType)
                .collect(Collectors.toSet());
        return types.contains(type);
    }

    // Small local helper to avoid repeating null/blank checks around optional config fields.
    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

}
