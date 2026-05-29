package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ApiResponse;
import org.example.backend.service.GitHubApiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller exposing public REST endpoint to handle secure incoming GitHub webhooks.
 */
@RestController
@RequestMapping("/api/v1/github")
@Slf4j
@RequiredArgsConstructor
public class GitHubWebhookController {

    private final GitHubApiService gitHubApiService;

    /**
     * Public endpoint to handle GitHub Webhook events.
     * Maps to POST /api/v1/github/webhook
     *
     * @param signatureHeader the HMAC SHA-256 signature header from GitHub
     * @param eventType       the GitHub event type header
     * @param payloadBody     the raw JSON payload body
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
