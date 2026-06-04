package org.example.backend.service.github.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.GitHubWebhookEvent;
import org.example.backend.entity.Project;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.example.backend.service.github.core.GitHubWebhookDispatcher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("GitHubWebhookServiceImpl")
class GitHubWebhookServiceImplTest {

    private final GitHubIntegrationRepository integrationRepository = mock(GitHubIntegrationRepository.class);
    private final GitHubIntegrationService integrationService = mock(GitHubIntegrationService.class);
    private final GitHubEvidenceService evidenceService = mock(GitHubEvidenceService.class);
    private final GitHubWebhookDispatcher dispatcher = mock(GitHubWebhookDispatcher.class);
    private final GitHubWebhookServiceImpl webhookService = new GitHubWebhookServiceImpl(
            new ObjectMapper(), integrationRepository, integrationService, evidenceService, dispatcher);

    @Test
    void validWebhookStoresRawEventAndDispatches() throws Exception {
        byte[] payload = payload("push");
        GitHubIntegration integration = integration();
        when(integrationRepository.findAll()).thenReturn(List.of(integration));
        when(integrationService.decryptToken("secret")).thenReturn("plain-secret");
        when(evidenceService.savePendingEvent(eq(integration), eq("delivery-1"), eq("push"), anyString(), anyString(), anyMap()))
                .thenReturn(Optional.of(GitHubWebhookEvent.builder().id(50L).build()));

        webhookService.handleWebhook(signature(payload, "plain-secret"), "delivery-1", "push", payload);

        verify(evidenceService).savePendingEvent(eq(integration), eq("delivery-1"), eq("push"), anyString(), anyString(), anyMap());
        verify(dispatcher).dispatch(eq("push"), anyMap(), eq(integration), eq(50L));
    }

    @Test
    void duplicateWebhookDoesNotDispatchAgain() throws Exception {
        byte[] payload = payload("push");
        GitHubIntegration integration = integration();
        when(integrationRepository.findAll()).thenReturn(List.of(integration));
        when(integrationService.decryptToken("secret")).thenReturn("plain-secret");
        when(evidenceService.savePendingEvent(eq(integration), eq("delivery-1"), eq("push"), anyString(), anyString(), anyMap()))
                .thenReturn(Optional.empty());

        webhookService.handleWebhook(signature(payload, "plain-secret"), "delivery-1", "push", payload);

        verifyNoInteractions(dispatcher);
    }

    @Test
    void invalidSignatureIsRejected() throws Exception {
        byte[] payload = payload("push");
        GitHubIntegration integration = integration();
        when(integrationRepository.findAll()).thenReturn(List.of(integration));
        when(integrationService.decryptToken("secret")).thenReturn("plain-secret");

        assertThatThrownBy(() -> webhookService.handleWebhook("sha256=bad", "delivery-1", "push", payload))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("Invalid webhook signature");
    }

    @Test
    void unknownRepositoryIsIgnoredSafely() throws Exception {
        byte[] payload = payload("push");
        when(integrationRepository.findAll()).thenReturn(List.of());

        webhookService.handleWebhook(signature(payload, "plain-secret"), "delivery-1", "push", payload);

        verifyNoInteractions(evidenceService, dispatcher);
    }

    private GitHubIntegration integration() {
        return GitHubIntegration.builder()
                .id(1L)
                .project(Project.builder().id(10L).build())
                .repoOwner("owner")
                .repoName("repo")
                .webhookSecretEncrypted("secret")
                .build();
    }

    private byte[] payload(String eventType) throws Exception {
        Map<String, Object> payload = Map.of(
                "zen", eventType,
                "repository", Map.of(
                        "name", "repo",
                        "owner", Map.of("login", "owner")));
        return new ObjectMapper().writeValueAsBytes(payload);
    }

    private String signature(byte[] payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(payload);
        StringBuilder hex = new StringBuilder("sha256=");
        for (byte b : hash) {
            String value = Integer.toHexString(0xff & b);
            if (value.length() == 1) hex.append('0');
            hex.append(value);
        }
        return hex.toString();
    }
}
