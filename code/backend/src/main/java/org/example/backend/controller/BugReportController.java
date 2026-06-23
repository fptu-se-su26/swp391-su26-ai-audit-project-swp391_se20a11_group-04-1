package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.entity.BugReport;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.CustomException;
import org.example.backend.service.BugReportService;
import org.example.backend.service.github.GitHubApiService;
import org.example.backend.entity.GitHubIntegration;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller exposing RESTful endpoints for Bug Reports management.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Transactional
public class BugReportController {

    private final BugReportService bugReportService;
    private final GitHubApiService gitHubApiService;

    @org.springframework.beans.factory.annotation.Value("${github.webhook-url}")
    private String githubWebhookUrl;

    @GetMapping("/projects/{projectId}/bugs")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProjectBugs(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        List<Map<String, Object>> bugs = bugReportService.getProjectBugReports(projectId, userId).stream()
                .map(this::toResponseMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(bugs, "Bug reports retrieved"));
    }

    @PostMapping("/projects/{projectId}/bugs")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createBug(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        Long userId = requireUser(session);
        BugReport bug = bugReportService.createBugReport(projectId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponseMap(bug), "Bug report draft created"));
    }

    @GetMapping("/bugs/{bugId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBug(
            @PathVariable Long bugId,
            HttpSession session) {
        Long userId = requireUser(session);
        BugReport bug = bugReportService.getBugReport(bugId, userId);
        return ResponseEntity.ok(ApiResponse.success(toResponseMap(bug), "Bug report retrieved"));
    }

    @PostMapping("/bugs/{bugId}/approve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveBug(
            @PathVariable Long bugId,
            HttpSession session) {
        Long userId = requireUser(session);
        BugReport bug = bugReportService.approveAndConvertBug(bugId, userId);
        return ResponseEntity.ok(ApiResponse.success(toResponseMap(bug), "Bug report approved and converted to task"));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }

    /**
     * Map entity to raw Map response to respect the zero-redundancy vision and avoid file noise.
     */
    private Map<String, Object> toResponseMap(BugReport bug) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", bug.getId());
        response.put("projectId", bug.getProject() != null ? bug.getProject().getId() : null);
        response.put("testExecutionId", bug.getTestExecution() != null ? bug.getTestExecution().getId() : null);
        response.put("title", bug.getTitle());
        response.put("description", bug.getDescription());
        response.put("severity", bug.getSeverity() != null ? bug.getSeverity().name() : null);
        response.put("environment", bug.getEnvironment() != null ? bug.getEnvironment().name() : null);
        response.put("stepsToReproduce", bug.getStepsToReproduce());
        response.put("expectedResult", bug.getExpectedResult());
        response.put("actualResult", bug.getActualResult());
        response.put("status", bug.getStatus() != null ? bug.getStatus().name() : null);
        response.put("fixCommitHash", bug.getFixCommitHash());
        response.put("relatedTaskId", bug.getRelatedTask() != null ? bug.getRelatedTask().getId() : null);
        response.put("createdAt", bug.getCreatedAt());
        response.put("updatedAt", bug.getUpdatedAt());

        if (bug.getRelatedTask() != null && bug.getRelatedTask().getChecklist() != null) {
            response.put("checklist", bug.getRelatedTask().getChecklist().stream()
                .map(item -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", item.getId());
                    map.put("content", item.getContent());
                    map.put("done", item.isDone());
                    map.put("orderIndex", item.getOrderIndex());
                    return map;
                })
                .collect(Collectors.toList()));
        }

        response.put("assignedTo", toUserSummaryMap(bug.getAssignedTo()));
        response.put("createdBy", toUserSummaryMap(bug.getCreatedBy()));
        return response;
    }

    private Map<String, Object> toUserSummaryMap(UserAccount user) {
        if (user == null) return null;
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", user.getId());
        summary.put("username", user.getUsername());
        summary.put("email", user.getEmail());
        String fullName = user.getProfile() != null ? user.getProfile().getFullName() : null;
        summary.put("fullName", fullName != null ? fullName : user.getUsername());
        return summary;
    }

    @GetMapping("/projects/{projectId}/github-integration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGithubConfig(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        GitHubIntegration config = gitHubApiService.getIntegration(projectId, userId);
        if (config == null) {
            Map<String, Object> emptyConfig = new HashMap<>();
            emptyConfig.put("hasToken", gitHubApiService.hasUserToken(userId));
            emptyConfig.put("configuredWebhookUrl", githubWebhookUrl);
            return ResponseEntity.ok(ApiResponse.success(emptyConfig, "No GitHub integration found"));
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", config.getId());
        response.put("repoOwner", config.getRepoOwner());
        response.put("repoName", config.getRepoName());
        response.put("webhookSecret", gitHubApiService.decryptToken(config.getWebhookSecretEncrypted()));
        response.put("hasToken", gitHubApiService.hasUserToken(userId));
        Map<String, Object> statusMap = gitHubApiService.getWebhookDeliveryStatus(projectId, userId);
        
        response.put("webhookStatus", statusMap != null ? statusMap.get("webhookStatus") : "PENDING");
        response.put("lastWebhookReceivedAt", statusMap != null ? statusMap.get("lastWebhookReceivedAt") : null);
        response.put("webhookUrl", config.getWebhookUrl());
        response.put("configuredWebhookUrl", githubWebhookUrl);
        response.put("webhookEventsJson", config.getWebhookEventsJson());
        response.put("webhookLastSyncedAt", config.getWebhookLastSyncedAt());
        
        return ResponseEntity.ok(ApiResponse.success(response, "GitHub integration retrieved"));
    }

    @GetMapping("/projects/{projectId}/github-integration/rate-limit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRateLimit(@PathVariable Long projectId, HttpSession session) {
        Long userId = requireUser(session);
        Map<String, Object> rateLimit = gitHubApiService.getRateLimit(projectId, userId);
        if (rateLimit == null) {
            return ResponseEntity.ok(ApiResponse.success(null, "No rate limit data available (Token may be invalid or missing)"));
        }
        return ResponseEntity.ok(ApiResponse.success(rateLimit, "Rate limit fetched successfully"));
    }

    @PostMapping("/projects/{projectId}/github-integration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveGithubConfig(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        Long userId = requireUser(session);
        GitHubIntegration config = gitHubApiService.saveIntegration(projectId, request, userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", config.getId());
        response.put("repoOwner", config.getRepoOwner());
        response.put("repoName", config.getRepoName());
        response.put("webhookSecret", gitHubApiService.decryptToken(config.getWebhookSecretEncrypted()));
        response.put("hasToken", gitHubApiService.hasUserToken(userId));
        Map<String, Object> statusMap = gitHubApiService.getWebhookDeliveryStatus(projectId, userId);
        
        response.put("webhookStatus", statusMap != null ? statusMap.get("webhookStatus") : "PENDING");
        response.put("lastWebhookReceivedAt", statusMap != null ? statusMap.get("lastWebhookReceivedAt") : null);
        response.put("webhookUrl", config.getWebhookUrl());
        response.put("webhookEventsJson", config.getWebhookEventsJson());
        response.put("webhookLastSyncedAt", config.getWebhookLastSyncedAt());
        
        return ResponseEntity.ok(ApiResponse.success(response, "GitHub integration saved successfully"));
    }

    @PostMapping("/projects/{projectId}/github-integration/ping")
    public ResponseEntity<ApiResponse<Void>> pingWebhook(@PathVariable Long projectId, HttpSession session) {
        Long userId = requireUser(session);
        gitHubApiService.pingWebhook(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Ping triggered successfully"));
    }

    @PostMapping("/projects/{projectId}/github-integration/auto-configure")
    public ResponseEntity<ApiResponse<Void>> autoConfigureWebhook(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> payload,
            HttpSession session) {
        Long userId = requireUser(session);
        String webhookUrl = (String) payload.get("webhookUrl");
        if (webhookUrl == null || webhookUrl.trim().isEmpty()) {
            webhookUrl = githubWebhookUrl;
        }
        if (webhookUrl == null || webhookUrl.trim().isEmpty()) {
            throw new CustomException("Webhook URL is not configured on the server", HttpStatus.BAD_REQUEST);
        }
        
        List<String> events = null;
        Object eventsObj = payload.get("events");
        if (eventsObj instanceof List) {
            events = (List<String>) eventsObj;
        }
        
        String webhookSecret = (String) payload.get("webhookSecret");
        
        gitHubApiService.autoConfigureWebhook(projectId, userId, webhookUrl, events, webhookSecret);
        return ResponseEntity.ok(ApiResponse.success(null, "Webhook auto-configured successfully"));
    }

    @PostMapping("/projects/{projectId}/github-integration/webhook/refresh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refreshWebhookConfig(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        Map<String, Object> status = gitHubApiService.refreshWebhookConfig(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(status, "Webhook configuration refreshed"));
    }

    @GetMapping("/projects/{projectId}/github-integration/deliveries")
    public ResponseEntity<ApiResponse<Object>> getDeliveries(@PathVariable Long projectId, HttpSession session) {
        Long userId = requireUser(session);
        Object deliveries = gitHubApiService.getWebhookDeliveries(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(deliveries, "Deliveries fetched"));
    }

    @PostMapping("/projects/{projectId}/github-integration/deliveries/{deliveryId}/redeliver")
    public ResponseEntity<ApiResponse<Void>> redeliverWebhook(
            @PathVariable Long projectId,
            @PathVariable Long deliveryId,
            HttpSession session) {
        Long userId = requireUser(session);
        gitHubApiService.redeliverWebhook(projectId, deliveryId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Redelivery triggered successfully"));
    }
}
