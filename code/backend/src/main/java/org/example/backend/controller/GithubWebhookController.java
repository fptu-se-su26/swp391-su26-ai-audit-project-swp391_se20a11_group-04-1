package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.GithubWebhookResponse;
import org.example.backend.service.GithubWebhookService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/github")
@RequiredArgsConstructor
public class GithubWebhookController {

    private final GithubWebhookService githubWebhookService;

    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<GithubWebhookResponse>> receiveWebhook(
            @RequestHeader(value = "X-GitHub-Event", required = false) String eventType,
            @RequestHeader(value = "X-GitHub-Delivery", required = false) String deliveryId,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody String payload) {
        // Return quickly after validation + raw storage so GitHub does not retry from timeout.
        GithubWebhookResponse response = githubWebhookService.receiveWebhook(eventType, deliveryId, signature, payload);
        return ResponseEntity.ok(ApiResponse.success(response, "GitHub webhook accepted"));
    }
}
