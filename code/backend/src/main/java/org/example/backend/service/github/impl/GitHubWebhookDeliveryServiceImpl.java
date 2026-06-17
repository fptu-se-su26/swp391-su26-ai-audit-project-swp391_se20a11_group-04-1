package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.UserGithubToken;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.repository.UserGithubTokenRepository;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.example.backend.service.github.core.GitHubWebhookDeliveryService;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GitHubWebhookDeliveryServiceImpl implements GitHubWebhookDeliveryService {

    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final UserGithubTokenRepository userGithubTokenRepository;
    private final GitHubIntegrationService integrationService;
    private final RestTemplate restTemplate = new RestTemplate(new org.springframework.http.client.JdkClientHttpRequestFactory());
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final List<String> CODE_INSIGHT_RECOMMENDED_EVENTS = List.of(
            "issues", "push", "pull_request", "workflow_run", "check_run");

    @Override
    public Map<String, Object> getWebhookDeliveryStatus(Long projectId, Long userId) {
        GitHubIntegration integration = integrationService.getIntegration(projectId, userId);
        if (integration == null) return null;

        UserGithubToken userToken = userGithubTokenRepository.findById(userId).orElse(null);
        if (userToken == null) return null;

        String accessToken = integrationService.decryptToken(userToken.getAccessTokenEncrypted());
        String url = hooksUrl(integration);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");

        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<String>(headers), List.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                for (Map<String, Object> hook : (List<Map<String, Object>>) response.getBody()) {
                    Map<String, Object> config = (Map<String, Object>) hook.get("config");
                    if (config != null) {
                        String hookUrl = (String) config.get("url");
                        if (hookUrl != null && hookUrl.contains("/api/v1/github/webhook")) {
                            return toStatusMap(hook);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch webhook status from GitHub API for project {}: {}", projectId, e.getMessage());
        }

        Map<String, Object> defaultMap = new HashMap<>();
        defaultMap.put("webhookStatus", "PENDING");
        return defaultMap;
    }

    @Override
    public void pingWebhook(Long projectId, Long userId) {
        GitHubIntegration integration = integrationService.getIntegration(projectId, userId);
        if (integration == null) throw new CustomException("Integration not found", HttpStatus.NOT_FOUND);

        UserGithubToken userToken = userGithubTokenRepository.findById(userId).orElse(null);
        if (userToken == null) throw new CustomException("GitHub token missing", HttpStatus.UNAUTHORIZED);

        String accessToken = integrationService.decryptToken(userToken.getAccessTokenEncrypted());
        HttpHeaders headers = githubV3Headers(accessToken);

        try {
            Long hookId = findAuditToolHookId(integration, headers);
            if (hookId != null) {
                String pingUrl = String.format("https://api.github.com/repos/%s/%s/hooks/%d/pings",
                        integration.getRepoOwner(), integration.getRepoName(), hookId);
                restTemplate.exchange(pingUrl, HttpMethod.POST, new HttpEntity<String>(headers), Void.class);
                log.info("Successfully triggered ping for webhook ID {} on repo {}/{}", hookId, integration.getRepoOwner(), integration.getRepoName());
                return;
            }
            throw new CustomException("Webhook configuration not found on GitHub", HttpStatus.NOT_FOUND);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to ping webhook for project {}: {}", projectId, e.getMessage());
            throw new CustomException("Failed to ping webhook: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Map<String, Object> getRateLimit(Long projectId, Long userId) {
        GitHubIntegration integration = integrationService.getIntegration(projectId, userId);
        if (integration == null) return null;

        UserGithubToken userToken = userGithubTokenRepository.findById(userId).orElse(null);
        if (userToken == null || userToken.getAccessTokenEncrypted() == null || userToken.getAccessTokenEncrypted().isEmpty()) {
            return null;
        }

        String accessToken = integrationService.decryptToken(userToken.getAccessTokenEncrypted());
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://api.github.com/rate_limit",
                    HttpMethod.GET,
                    new HttpEntity<Void>(createGitHubHeaders(accessToken)),
                    Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> resources = (Map<String, Object>) response.getBody().get("resources");
                return (Map<String, Object>) resources.get("core");
            }
        } catch (Exception e) {
            log.error("Failed to fetch rate limit from GitHub API", e);
        }
        return null;
    }

    @Override
    public Object getWebhookDeliveries(Long projectId, Long userId) {
        GitHubIntegration integration = integrationService.getIntegration(projectId, userId);
        if (integration == null) throw new CustomException("GitHub integration not found", HttpStatus.NOT_FOUND);

        HttpHeaders headers = buildAuthHeaders(integrationService.getDecryptedUserToken(userId));
        Long hookId = findRequiredAuditToolHookId(integration, headers);
        String deliveriesUrl = hooksUrl(integration) + "/" + hookId + "/deliveries?per_page=30";
        ResponseEntity<List> deliveriesResp = restTemplate.exchange(deliveriesUrl, HttpMethod.GET, new HttpEntity<>(headers), List.class);

        List<Map<String, Object>> deliveries = deliveriesResp.getBody();
        if (deliveries != null) {
            for (Map<String, Object> delivery : deliveries) {
                if (delivery.get("id") != null) {
                    delivery.put("id", delivery.get("id").toString());
                }
            }
        }
        return deliveries;
    }

    @Override
    public void redeliverWebhook(Long projectId, Long deliveryId, Long userId) {
        GitHubIntegration integration = integrationService.getIntegration(projectId, userId);
        if (integration == null) throw new CustomException("GitHub integration not found", HttpStatus.NOT_FOUND);

        HttpHeaders headers = buildAuthHeaders(integrationService.getDecryptedUserToken(userId));
        Long hookId = findRequiredAuditToolHookId(integration, headers);
        String redeliverUrl = hooksUrl(integration) + "/" + hookId + "/deliveries/" + deliveryId + "/attempts";

        try {
            restTemplate.exchange(redeliverUrl, HttpMethod.POST, new HttpEntity<>("", headers), String.class);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Failed to redeliver webhook {}. HTTP {}. Body: {}", deliveryId, e.getStatusCode(), errorBody);
            throw new CustomException("GitHub API Error: " + errorBody, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Failed to redeliver webhook for delivery ID {}", deliveryId, e);
            throw new CustomException("Failed to trigger redelivery: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
        log.info("Webhook delivery {} redelivered for project {}", deliveryId, projectId);
    }

    @Override
    public void autoConfigureWebhook(Long projectId, Long userId, String webhookUrl, List<String> events, String webhookSecret) {
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CustomException("No GitHub configuration found for this project", HttpStatus.BAD_REQUEST));

        HttpHeaders headers = buildAuthHeaders(integrationService.getDecryptedUserToken(userId));
        String hooksUrl = hooksUrl(integration);

        if (webhookSecret != null && !webhookSecret.trim().isEmpty()) {
            integration.setWebhookSecretEncrypted(integrationService.encryptToken(webhookSecret.trim()));
            gitHubIntegrationRepository.save(integration);
        }

        try {
            ResponseEntity<List> hooksResp = restTemplate.exchange(hooksUrl, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            if (hooksResp.getBody() != null) {
                for (Object item : hooksResp.getBody()) {
                    Map<String, Object> hook = (Map<String, Object>) item;
                    Map<String, Object> config = (Map<String, Object>) hook.get("config");
                    if (config != null && webhookUrl.equals(config.get("url"))) {
                        Long hookId = ((Number) hook.get("id")).longValue();
                        updateWebhook(hookId, hooksUrl, webhookUrl, integration.getWebhookSecretEncrypted(), events, headers);
                        persistWebhookConfig(integration, webhookUrl, normalizedEvents(events));
                        return;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch existing webhooks", e);
            throw new CustomException("Failed to check existing webhooks on GitHub", HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> body = webhookRequestBody(webhookUrl, integration.getWebhookSecretEncrypted(), events);
        try {
            restTemplate.postForEntity(hooksUrl, new HttpEntity<>(body, headers), Map.class);
            persistWebhookConfig(integration, webhookUrl, normalizedEvents(events));
            log.info("Auto-configured webhook for project {} at {}", projectId, hooksUrl);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Failed to create webhook. HTTP {}. Body: {}", e.getStatusCode(), errorBody);
            throw new CustomException("GitHub API Error: " + errorBody, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Failed to create webhook", e);
            throw new CustomException("Failed to auto-configure webhook on GitHub", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Map<String, Object> refreshWebhookConfig(Long projectId, Long userId) {
        GitHubIntegration integration = integrationService.getIntegration(projectId, userId);
        if (integration == null) throw new CustomException("GitHub integration not found", HttpStatus.NOT_FOUND);

        HttpHeaders headers = buildAuthHeaders(integrationService.getDecryptedUserToken(userId));
        ResponseEntity<List> hooksResp = restTemplate.exchange(hooksUrl(integration), HttpMethod.GET, new HttpEntity<>(headers), List.class);
        if (hooksResp.getBody() == null || hooksResp.getBody().isEmpty()) {
            throw new CustomException("No webhook found on GitHub repository", HttpStatus.NOT_FOUND);
        }

        for (Object item : hooksResp.getBody()) {
            Map<String, Object> hook = (Map<String, Object>) item;
            Map<String, Object> config = (Map<String, Object>) hook.get("config");
            if (config != null && config.get("url") != null && config.get("url").toString().contains("/api/v1/github/webhook")) {
                String webhookUrl = config.get("url").toString();
                List<String> events = hook.get("events") instanceof List
                        ? (List<String>) hook.get("events")
                        : CODE_INSIGHT_RECOMMENDED_EVENTS;
                persistWebhookConfig(integration, webhookUrl, events);
                Map<String, Object> status = toStatusMap(hook);
                status.put("webhookUrl", webhookUrl);
                status.put("webhookEvents", events);
                status.put("webhookActive", hook.get("active"));
                return status;
            }
        }

        throw new CustomException("Could not find the specific Audit Tool webhook on this repository", HttpStatus.NOT_FOUND);
    }

    private Map<String, Object> toStatusMap(Map<String, Object> hook) {
        Map<String, Object> statusMap = new HashMap<>();
        Map<String, Object> lastResponse = (Map<String, Object>) hook.get("last_response");
        if (lastResponse != null) {
            String status = (String) lastResponse.get("status");
            Integer code = parseInteger(lastResponse.get("code"));
            if (status == null || "unused".equalsIgnoreCase(status)) {
                statusMap.put("webhookStatus", "PENDING");
            } else if (code != null && code >= 200 && code < 300) {
                statusMap.put("webhookStatus", "HEALTHY");
                statusMap.put("lastWebhookReceivedAt", hook.get("updated_at"));
            } else {
                statusMap.put("webhookStatus", "FAILED");
                statusMap.put("lastWebhookReceivedAt", hook.get("updated_at"));
            }
        } else {
            statusMap.put("webhookStatus", "PENDING");
        }
        return statusMap;
    }

    private Long findRequiredAuditToolHookId(GitHubIntegration integration, HttpHeaders headers) {
        Long hookId = findAuditToolHookId(integration, headers);
        if (hookId == null) {
            throw new CustomException("Could not find the specific Audit Tool webhook on this repository", HttpStatus.NOT_FOUND);
        }
        return hookId;
    }

    private Long findAuditToolHookId(GitHubIntegration integration, HttpHeaders headers) {
        ResponseEntity<List> hooksResp = restTemplate.exchange(hooksUrl(integration), HttpMethod.GET, new HttpEntity<>(headers), List.class);
        if (hooksResp.getBody() == null || hooksResp.getBody().isEmpty()) {
            throw new CustomException("No webhook found on GitHub repository", HttpStatus.NOT_FOUND);
        }

        for (Object item : hooksResp.getBody()) {
            Map<String, Object> hook = (Map<String, Object>) item;
            Map<String, Object> config = (Map<String, Object>) hook.get("config");
            if (config != null && config.get("url") != null && config.get("url").toString().contains("/api/v1/github/webhook")) {
                Object idObj = hook.get("id");
                if (idObj instanceof Number) return ((Number) idObj).longValue();
                if (idObj instanceof String) return Long.parseLong((String) idObj);
            }
        }
        return null;
    }

    private void updateWebhook(Long hookId, String hooksUrl, String webhookUrl, String encryptedSecret, List<String> events, HttpHeaders headers) {
        String updateUrl = hooksUrl + "/" + hookId;
        Map<String, Object> body = webhookRequestBody(webhookUrl, encryptedSecret, events);
        try {
            restTemplate.exchange(updateUrl, HttpMethod.PATCH, new HttpEntity<>(body, headers), Map.class);
            log.info("Updated existing webhook {} at {}", hookId, updateUrl);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Failed to update webhook. HTTP {}. Body: {}", e.getStatusCode(), errorBody);
            throw new CustomException("GitHub API Error: " + errorBody, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Failed to update existing webhook", e);
            throw new CustomException("Failed to update webhook on GitHub", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Map<String, Object> webhookRequestBody(String webhookUrl, String encryptedSecret, List<String> events) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "web");
        body.put("active", true);
        if (events == null || events.isEmpty()) {
            body.put("events", CODE_INSIGHT_RECOMMENDED_EVENTS);
        } else if (events.contains("*")) {
            body.put("events", Arrays.asList("*"));
        } else {
            body.put("events", events);
        }

        Map<String, String> config = new HashMap<>();
        config.put("url", webhookUrl);
        config.put("content_type", "json");
        config.put("insecure_ssl", "0");
        config.put("secret", integrationService.decryptToken(encryptedSecret));
        body.put("config", config);
        return body;
    }

    private List<String> normalizedEvents(List<String> events) {
        if (events == null || events.isEmpty()) return CODE_INSIGHT_RECOMMENDED_EVENTS;
        if (events.contains("*")) return Arrays.asList("*");
        return events;
    }

    private void persistWebhookConfig(GitHubIntegration integration, String webhookUrl, List<String> events) {
        integration.setWebhookUrl(webhookUrl);
        try {
            integration.setWebhookEventsJson(objectMapper.writeValueAsString(events));
        } catch (JsonProcessingException e) {
            throw new CustomException("Failed to persist webhook event configuration", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        integration.setWebhookLastSyncedAt(LocalDateTime.now());
        gitHubIntegrationRepository.save(integration);
    }

    private String hooksUrl(GitHubIntegration integration) {
        return "https://api.github.com/repos/" + integration.getRepoOwner() + "/" + integration.getRepoName() + "/hooks";
    }

    private HttpHeaders githubV3Headers(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("Accept", "application/vnd.github.v3+json");
        return headers;
    }

    private HttpHeaders buildAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Accept", "application/vnd.github+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }

    private HttpHeaders createGitHubHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Accept", "application/vnd.github+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }

    private Integer parseInteger(Object value) {
        if (value instanceof Number) return ((Number) value).intValue();
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }
}
