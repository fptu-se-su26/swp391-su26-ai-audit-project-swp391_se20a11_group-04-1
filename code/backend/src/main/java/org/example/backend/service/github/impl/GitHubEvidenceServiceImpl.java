package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.*;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.GitHubCheckRunRepository;
import org.example.backend.repository.GitHubCommitRepository;
import org.example.backend.repository.GitHubPullRequestRepository;
import org.example.backend.repository.GitHubWebhookEventRepository;
import org.example.backend.service.CodeInsightEvidenceLinkService;
import org.example.backend.service.WebSocketBroadcastService;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GitHubEvidenceServiceImpl implements GitHubEvidenceService {

    private static final int MAX_ERROR_LENGTH = 2000;

    private final GitHubWebhookEventRepository webhookEventRepository;
    private final GitHubCommitRepository commitRepository;
    private final GitHubPullRequestRepository pullRequestRepository;
    private final GitHubCheckRunRepository checkRunRepository;
    private final CodeInsightEvidenceLinkService evidenceLinkService;
    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    private final WebSocketBroadcastService webSocketBroadcastService;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<GitHubWebhookEvent> savePendingEvent(
            GitHubIntegration integration,
            String deliveryId,
            String eventType,
            String signature,
            String payloadHash,
            Map<String, Object> payload) {
        Optional<GitHubWebhookEvent> existing = webhookEventRepository.findByDeliveryId(deliveryId);
        if (existing.isPresent()) {
            return Optional.empty();
        }

        GitHubWebhookEvent event = GitHubWebhookEvent.builder()
                .integration(integration)
                .deliveryId(deliveryId)
                .eventType(eventType)
                .signature(signature)
                .payloadHash(payloadHash)
                .payloadJson(payload)
                .processedStatus(GitHubWebhookEventStatus.PENDING)
                .build();
        return Optional.of(webhookEventRepository.saveAndFlush(event));
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markProcessing(Long eventId) {
        webhookEventRepository.findById(eventId).ifPresent(event -> {
            event.setProcessedStatus(GitHubWebhookEventStatus.PROCESSING);
            event.setErrorMessage(null);
            webhookEventRepository.save(event);
        });
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markProcessed(Long eventId) {
        updateTerminalStatus(eventId, GitHubWebhookEventStatus.PROCESSED, null);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markIgnored(Long eventId) {
        updateTerminalStatus(eventId, GitHubWebhookEventStatus.IGNORED, null);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long eventId, String errorMessage) {
        updateTerminalStatus(eventId, GitHubWebhookEventStatus.FAILED, truncate(errorMessage));
    }

    @Override
    @Transactional
    public void upsertCommit(GitHubIntegration integration, Map<String, Object> commitPayload, String branchName) {
        String resolvedSha = text(commitPayload.get("id"));
        if (resolvedSha == null) {
            resolvedSha = text(commitPayload.get("sha"));
        }
        if (resolvedSha == null) return;
        final String sha = resolvedSha;

        GitHubCommit commit = commitRepository.findByIntegrationIdAndSha(integration.getId(), sha)
                .orElseGet(() -> GitHubCommit.builder()
                        .integration(integration)
                        .project(integration.getProject())
                        .sha(sha)
                        .build());

        Map<String, Object> author = map(commitPayload.get("author"));
        commit.setBranchName(branchName);
        commit.setMessage(text(commitPayload.get("message")));
        commit.setAuthorName(text(author.get("name")));
        commit.setAuthorEmail(text(author.get("email")));
        commit.setAuthorLogin(extractLogin(commitPayload.get("sender")));
        commit.setCommittedAt(parseTime(author.get("date")));
        commit.setUrl(firstText(commitPayload.get("html_url"), commitPayload.get("url")));
        commit.setUpdatedAt(LocalDateTime.now());
        commitRepository.save(commit);
        evidenceLinkService.linkCommit(commit);

        // Broadcast to WebSocket to notify client that commit evidence has been linked/updated
        List<CodeInsightEvidenceLink> links = evidenceLinkRepository.findByProjectIdAndEvidenceTypeAndEvidenceId(
                integration.getProject().getId(), CodeInsightEvidenceType.COMMIT, commit.getId());
        for (CodeInsightEvidenceLink link : links) {
            if (link.getTask() != null) {
                webSocketBroadcastService.broadcastEvidenceUpdated(
                        integration.getProject().getId(),
                        link.getTask().getId(),
                        "COMMIT",
                        "PUSHED");
                webSocketBroadcastService.broadcastGateUpdated(
                        integration.getProject().getId(),
                        link.getTask().getId(),
                        null,
                        null);
            }
        }
    }

    @Override
    @Transactional
    public void upsertPullRequest(GitHubIntegration integration, Map<String, Object> pullRequestPayload) {
        Integer number = number(pullRequestPayload.get("number"));
        if (number == null) return;

        GitHubPullRequest pullRequest = pullRequestRepository.findByIntegrationIdAndPrNumber(integration.getId(), number)
                .orElseGet(() -> GitHubPullRequest.builder()
                        .integration(integration)
                        .project(integration.getProject())
                        .prNumber(number)
                        .build());

        Map<String, Object> user = map(pullRequestPayload.get("user"));
        Map<String, Object> head = map(pullRequestPayload.get("head"));
        Map<String, Object> base = map(pullRequestPayload.get("base"));

        pullRequest.setTitle(text(pullRequestPayload.get("title")));
        pullRequest.setBody(text(pullRequestPayload.get("body")));
        pullRequest.setState(text(pullRequestPayload.get("state")));
        pullRequest.setDraft(Boolean.TRUE.equals(pullRequestPayload.get("draft")));
        pullRequest.setAuthorLogin(text(user.get("login")));
        pullRequest.setHeadBranch(text(head.get("ref")));
        pullRequest.setBaseBranch(text(base.get("ref")));
        pullRequest.setHeadSha(text(head.get("sha")));
        pullRequest.setMergeCommitSha(text(pullRequestPayload.get("merge_commit_sha")));
        pullRequest.setMergedAt(parseTime(pullRequestPayload.get("merged_at")));
        pullRequest.setUrl(text(pullRequestPayload.get("html_url")));
        pullRequest.setUpdatedAt(LocalDateTime.now());
        pullRequestRepository.save(pullRequest);
        evidenceLinkService.linkPullRequest(pullRequest);

        // Broadcast to WebSocket to notify client that pull request evidence has been linked/updated
        List<CodeInsightEvidenceLink> links = evidenceLinkRepository.findByProjectIdAndEvidenceTypeAndEvidenceId(
                integration.getProject().getId(), CodeInsightEvidenceType.PULL_REQUEST, pullRequest.getId());
        for (CodeInsightEvidenceLink link : links) {
            if (link.getTask() != null) {
                webSocketBroadcastService.broadcastEvidenceUpdated(
                        integration.getProject().getId(),
                        link.getTask().getId(),
                        "PULL_REQUEST",
                        pullRequest.getState());
                webSocketBroadcastService.broadcastGateUpdated(
                        integration.getProject().getId(),
                        link.getTask().getId(),
                        null,
                        null);
            }
        }
    }

    @Override
    @Transactional
    public void upsertWorkflowRun(GitHubIntegration integration, Map<String, Object> workflowRunPayload) {
        String externalId = text(workflowRunPayload.get("id"));
        if (externalId == null) return;

        GitHubCheckRun checkRun = checkRunRepository
                .findByIntegrationIdAndEventTypeAndExternalId(integration.getId(), "workflow_run", externalId)
                .orElseGet(() -> GitHubCheckRun.builder()
                        .integration(integration)
                        .project(integration.getProject())
                        .eventType("workflow_run")
                        .externalId(externalId)
                        .build());

        checkRun.setSha(text(workflowRunPayload.get("head_sha")));
        checkRun.setName(firstText(workflowRunPayload.get("name"), workflowRunPayload.get("display_title")));
        checkRun.setStatus(text(workflowRunPayload.get("status")));
        checkRun.setConclusion(text(workflowRunPayload.get("conclusion")));
        checkRun.setStartedAt(parseTime(workflowRunPayload.get("run_started_at")));
        checkRun.setCompletedAt(parseTime(workflowRunPayload.get("updated_at")));
        checkRun.setUrl(text(workflowRunPayload.get("html_url")));
        checkRun.setUpdatedAt(LocalDateTime.now());
        checkRunRepository.save(checkRun);
        evidenceLinkService.linkCheckRun(checkRun);

        // Broadcast to WebSocket to notify client that workflow/check run evidence has been linked/updated
        List<CodeInsightEvidenceLink> links = evidenceLinkRepository.findByProjectIdAndEvidenceTypeAndEvidenceId(
                integration.getProject().getId(), CodeInsightEvidenceType.CHECK_RUN, checkRun.getId());
        for (CodeInsightEvidenceLink link : links) {
            if (link.getTask() != null) {
                webSocketBroadcastService.broadcastEvidenceUpdated(
                        integration.getProject().getId(),
                        link.getTask().getId(),
                        "CHECK_RUN",
                        checkRun.getConclusion() != null ? checkRun.getConclusion() : checkRun.getStatus());
                webSocketBroadcastService.broadcastGateUpdated(
                        integration.getProject().getId(),
                        link.getTask().getId(),
                        null,
                        null);
            }
        }
    }

    @Override
    @Transactional
    public void upsertCheckRun(GitHubIntegration integration, Map<String, Object> checkRunPayload) {
        String externalId = text(checkRunPayload.get("id"));
        if (externalId == null) return;

        GitHubCheckRun checkRun = checkRunRepository
                .findByIntegrationIdAndEventTypeAndExternalId(integration.getId(), "check_run", externalId)
                .orElseGet(() -> GitHubCheckRun.builder()
                        .integration(integration)
                        .project(integration.getProject())
                        .eventType("check_run")
                        .externalId(externalId)
                        .build());

        Map<String, Object> checkSuite = map(checkRunPayload.get("check_suite"));
        checkRun.setSha(firstText(checkRunPayload.get("head_sha"), checkSuite.get("head_sha")));
        checkRun.setName(text(checkRunPayload.get("name")));
        checkRun.setStatus(text(checkRunPayload.get("status")));
        checkRun.setConclusion(text(checkRunPayload.get("conclusion")));
        checkRun.setStartedAt(parseTime(checkRunPayload.get("started_at")));
        checkRun.setCompletedAt(parseTime(checkRunPayload.get("completed_at")));
        checkRun.setUrl(text(checkRunPayload.get("html_url")));
        checkRun.setUpdatedAt(LocalDateTime.now());
        checkRunRepository.save(checkRun);
        evidenceLinkService.linkCheckRun(checkRun);

        // Broadcast to WebSocket to notify client that workflow/check run evidence has been linked/updated
        List<CodeInsightEvidenceLink> links = evidenceLinkRepository.findByProjectIdAndEvidenceTypeAndEvidenceId(
                integration.getProject().getId(), CodeInsightEvidenceType.CHECK_RUN, checkRun.getId());
        for (CodeInsightEvidenceLink link : links) {
            if (link.getTask() != null) {
                webSocketBroadcastService.broadcastEvidenceUpdated(
                        integration.getProject().getId(),
                        link.getTask().getId(),
                        "CHECK_RUN",
                        checkRun.getConclusion() != null ? checkRun.getConclusion() : checkRun.getStatus());
                webSocketBroadcastService.broadcastGateUpdated(
                        integration.getProject().getId(),
                        link.getTask().getId(),
                        null,
                        null);
            }
        }
    }

    private void updateTerminalStatus(Long eventId, GitHubWebhookEventStatus status, String errorMessage) {
        webhookEventRepository.findById(eventId).ifPresent(event -> {
            event.setProcessedStatus(status);
            event.setProcessedAt(LocalDateTime.now());
            event.setErrorMessage(errorMessage);
            webhookEventRepository.save(event);
        });
    }

    private String extractLogin(Object value) {
        Map<String, Object> map = map(value);
        return text(map.get("login"));
    }

    private String firstText(Object first, Object second) {
        String firstValue = text(first);
        return firstValue != null ? firstValue : text(second);
    }

    private LocalDateTime parseTime(Object value) {
        String text = text(value);
        if (text == null) return null;
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(text);
            } catch (Exception ignoredAgain) {
                return null;
            }
        }
    }

    private Integer number(Object value) {
        if (value instanceof Number n) return n.intValue();
        if (value == null) return null;
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String text(Object value) {
        if (value == null) return null;
        String result = value.toString();
        return result.trim().isEmpty() ? null : result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Object value) {
        return value instanceof Map<?, ?> ? (Map<String, Object>) value : Map.of();
    }

    private String truncate(String message) {
        if (message == null || message.length() <= MAX_ERROR_LENGTH) return message;
        return message.substring(0, MAX_ERROR_LENGTH);
    }
}
