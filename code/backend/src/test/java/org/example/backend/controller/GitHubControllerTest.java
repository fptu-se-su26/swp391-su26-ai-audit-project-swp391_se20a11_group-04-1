package org.example.backend.controller;

import org.example.backend.dto.ApiResponse;
import org.example.backend.service.github.GitHubApiService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GitHubController — Unit Tests")
class GitHubControllerTest {

    @Mock
    private GitHubApiService gitHubApiService;

    @InjectMocks
    private GitHubController gitHubController;

    @Test
    @DisplayName("getAuthUrl — Returns OAuth URL")
    void getAuthUrl_Success() {
        when(gitHubApiService.getOAuthUrl()).thenReturn("https://github.com/login/oauth/authorize?client_id=123");

        ResponseEntity<ApiResponse<String>> response = gitHubController.getAuthUrl();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).isEqualTo("https://github.com/login/oauth/authorize?client_id=123");
        verify(gitHubApiService, times(1)).getOAuthUrl();
    }

    @Test
    @DisplayName("handleCallback — Exchanges code for token")
    void handleCallback_Success() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userId", 1L);

        Map<String, String> body = new HashMap<>();
        body.put("code", "github_oauth_code");

        when(gitHubApiService.exchangeCodeForToken("github_oauth_code", 1L)).thenReturn("Token stored successfully");

        ResponseEntity<ApiResponse<String>> response = gitHubController.handleCallback(body, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).isEqualTo("Token stored successfully");
        verify(gitHubApiService, times(1)).exchangeCodeForToken("github_oauth_code", 1L);
    }

    @Test
    @DisplayName("getUserRepos — Returns user repositories")
    void getUserRepos_Success() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userId", 1L);

        List<Object> mockRepos = List.of(Map.of("id", 1, "name", "repo1"));
        when(gitHubApiService.getUserRepositories(1L)).thenReturn(mockRepos);

        ResponseEntity<ApiResponse<Object>> response = gitHubController.getUserRepos(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).isEqualTo(mockRepos);
        verify(gitHubApiService, times(1)).getUserRepositories(1L);
    }

    @Test
    @DisplayName("createRepository — Creates a new repository on GitHub")
    void createRepository_Success() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userId", 1L);

        Map<String, Object> body = new HashMap<>();
        body.put("name", "new-repo");
        body.put("description", "A new repo");
        body.put("isPrivate", true);

        Map<String, Object> mockResponse = Map.of("id", 123, "name", "new-repo");
        when(gitHubApiService.createRepository(1L, "new-repo", "A new repo", true, false, null, null)).thenReturn(mockResponse);

        ResponseEntity<ApiResponse<Object>> response = gitHubController.createRepository(body, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getData()).isEqualTo(mockResponse);
        verify(gitHubApiService, times(1)).createRepository(1L, "new-repo", "A new repo", true, false, null, null);
    }

    @Test
    @DisplayName("handleGitHubWebhook — Should successfully receive headers and delegate to service layer")
    void handleGitHubWebhook_Success() {
        // GIVEN
        String mockSignature = "sha256=12345abcde67890f";
        String mockDelivery = "delivery-1";
        String mockEvent = "issues";
        byte[] mockPayload = "{\"action\":\"opened\",\"issue\":{\"number\":12}}".getBytes();

        doNothing().when(gitHubApiService).handleWebhook(eq(mockSignature), eq(mockDelivery), eq(mockEvent), eq(mockPayload));

        // WHEN
        ResponseEntity<ApiResponse<String>> response = gitHubController.handleGitHubWebhook(
                mockSignature, mockDelivery, mockEvent, mockPayload
        );

        // THEN
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getMessage()).isEqualTo("Event synchronized");
        assertThat(response.getBody().getData()).isEqualTo("Webhook processed successfully");

        verify(gitHubApiService, times(1)).handleWebhook(eq(mockSignature), eq(mockDelivery), eq(mockEvent), eq(mockPayload));
    }
}
