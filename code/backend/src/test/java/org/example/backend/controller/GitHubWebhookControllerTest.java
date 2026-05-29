package org.example.backend.controller;

import org.example.backend.dto.ApiResponse;
import org.example.backend.service.GitHubApiService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GitHubWebhookController — Unit Tests")
class GitHubWebhookControllerTest {

    @Mock
    private GitHubApiService gitHubApiService;

    @InjectMocks
    private GitHubWebhookController gitHubWebhookController;

    @Test
    @DisplayName("handleGitHubWebhook — Should successfully receive headers and delegate to service layer")
    void handleGitHubWebhook_Success() {
        // GIVEN
        String mockSignature = "sha256=12345abcde67890f";
        String mockEvent = "issues";
        byte[] mockPayload = "{\"action\":\"opened\",\"issue\":{\"number\":12}}".getBytes();

        doNothing().when(gitHubApiService).handleWebhook(eq(mockSignature), eq(mockEvent), eq(mockPayload));

        // WHEN
        ResponseEntity<ApiResponse<String>> response = gitHubWebhookController.handleGitHubWebhook(
                mockSignature, mockEvent, mockPayload
        );

        // THEN
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).isEqualTo("Event synchronized");
        assertThat(response.getBody().getData()).isEqualTo("Webhook processed successfully");

        verify(gitHubApiService, times(1)).handleWebhook(eq(mockSignature), eq(mockEvent), eq(mockPayload));
    }
}
