package org.example.backend.service.github.impl;

import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.Project;
import org.example.backend.service.github.code.GitHubCheckRunEventHandler;
import org.example.backend.service.github.code.GitHubPullRequestEventHandler;
import org.example.backend.service.github.code.GitHubPushEventHandler;
import org.example.backend.service.github.code.GitHubWorkflowRunEventHandler;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.example.backend.service.github.issue.GitHubIssueEventHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
@DisplayName("GitHubWebhookDispatcherImpl")
class GitHubWebhookDispatcherImplTest {

    @Mock private GitHubEvidenceService evidenceService;
    @Mock private GitHubIssueEventHandler issueEventHandler;
    @Mock private GitHubPushEventHandler pushEventHandler;
    @Mock private GitHubPullRequestEventHandler pullRequestEventHandler;
    @Mock private GitHubWorkflowRunEventHandler workflowRunEventHandler;
    @Mock private GitHubCheckRunEventHandler checkRunEventHandler;

    @InjectMocks
    private GitHubWebhookDispatcherImpl dispatcher;

    @Test
    void dispatchesPushToPushHandlerAndMarksProcessed() {
        GitHubIntegration integration = integration();
        Map<String, Object> payload = Map.of("commits", java.util.List.of());

        dispatcher.dispatch("push", payload, integration, 100L);

        verify(evidenceService).markProcessing(100L);
        verify(pushEventHandler).handlePushEvent(payload, integration);
        verify(evidenceService).markProcessed(100L);
    }

    @Test
    void dispatchesIssueEventWithoutChangingIssueHandlerContract() {
        GitHubIntegration integration = integration();
        Map<String, Object> issue = Map.of("number", 5);
        Map<String, Object> payload = Map.of("action", "closed", "issue", issue);

        dispatcher.dispatch("issues", payload, integration, 101L);

        verify(issueEventHandler).handleIssueEvent("closed", issue, payload, integration);
        verify(evidenceService).markProcessed(101L);
    }

    @Test
    void unsupportedEventIsMarkedIgnored() {
        dispatcher.dispatch("label", Map.of(), integration(), 102L);

        verify(evidenceService).markIgnored(102L);
        verifyNoInteractions(pushEventHandler, pullRequestEventHandler, workflowRunEventHandler, checkRunEventHandler);
    }

    @Test
    void handlerExceptionMarksFailed() {
        GitHubIntegration integration = integration();
        Map<String, Object> payload = Map.of("pull_request", Map.of("number", 1));
        org.mockito.Mockito.doThrow(new IllegalStateException("boom"))
                .when(pullRequestEventHandler).handlePullRequestEvent(any(), any());

        dispatcher.dispatch("pull_request", payload, integration, 103L);

        verify(evidenceService).markFailed(103L, "boom");
    }

    private GitHubIntegration integration() {
        return GitHubIntegration.builder()
                .id(1L)
                .project(Project.builder().id(10L).build())
                .repoOwner("owner")
                .repoName("repo")
                .build();
    }
}
