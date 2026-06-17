package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ApiResponse;
import org.example.backend.service.github.GitHubApiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller exposing REST endpoints to handle GitHub OAuth and secure incoming GitHub webhooks.
 */
@RestController
@RequestMapping("/api/v1/github")
@Slf4j
@RequiredArgsConstructor
public class GitHubController {

    private final GitHubApiService gitHubApiService;

    /**
     * Endpoint to get the GitHub OAuth authorization URL.
     */
    @GetMapping("/auth-url")
    public ResponseEntity<ApiResponse<String>> getAuthUrl() {
        return ResponseEntity.ok(ApiResponse.success(gitHubApiService.getOAuthUrl(), "Success"));
    }

    /**
     * Endpoint to handle the GitHub OAuth callback and exchange the code for an access token.
     */
    @PostMapping("/callback")
    public ResponseEntity<ApiResponse<String>> handleCallback(@RequestBody java.util.Map<String, String> body, jakarta.servlet.http.HttpSession session) {
        String code = body.get("code");
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new org.example.backend.exception.CustomException("Please login to continue", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        return ResponseEntity.ok(ApiResponse.success(gitHubApiService.exchangeCodeForToken(code, userId), "GitHub account connected successfully"));
    }

    /**
     * Endpoint to fetch all repositories accessible by the connected user.
     */
    @GetMapping("/repos")
    public ResponseEntity<ApiResponse<Object>> getUserRepos(jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new org.example.backend.exception.CustomException("Please login to continue", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        return ResponseEntity.ok(ApiResponse.success(gitHubApiService.getUserRepositories(userId), "Success"));
    }

    /**
     * Endpoint to create a new repository for the connected user on GitHub.
     */
    @PostMapping("/repos")
    public ResponseEntity<ApiResponse<Object>> createRepository(@RequestBody java.util.Map<String, Object> body, jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new org.example.backend.exception.CustomException("Please login to continue", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Boolean isPrivate = (Boolean) body.getOrDefault("isPrivate", false);
        
        if (name == null || name.trim().isEmpty()) {
            throw new org.example.backend.exception.CustomException("Repository name is required", org.springframework.http.HttpStatus.BAD_REQUEST);
        }
        
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success(gitHubApiService.createRepository(userId, name, description, isPrivate), "Repository created successfully"));
    }

    /**
     * Public endpoint to handle GitHub Webhook events.
     * Maps to POST /api/v1/github/webhook
     *
     * @param signatureHeader the HMAC SHA-256 signature header from GitHub
     * @param eventType       the GitHub event type header
     * @param payloadBytes    the raw JSON payload body
     * @return a successful API Response
     */
    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<String>> handleGitHubWebhook(
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signatureHeader,
            @RequestHeader(value = "X-GitHub-Event", required = false) String eventType,
            @RequestBody byte[] payloadBytes) {
        
        log.info("Received incoming GitHub Webhook event: {}", eventType);
        
        // Delegate verification and two-way sync processing to the Service layer
        gitHubApiService.handleWebhook(signatureHeader, eventType, payloadBytes);
        
        return ResponseEntity.ok(ApiResponse.success("Webhook processed successfully", "Event synchronized"));
    }
}

