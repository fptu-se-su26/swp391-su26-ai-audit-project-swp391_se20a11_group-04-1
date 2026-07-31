package org.example.backend.service.github.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.GitHubWebhookEvent;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.service.github.core.GitHubEvidenceService;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.example.backend.service.github.core.GitHubWebhookDispatcher;
import org.example.backend.service.github.core.GitHubWebhookService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GitHubWebhookServiceImpl implements GitHubWebhookService {

    private final ObjectMapper objectMapper;
    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final GitHubIntegrationService integrationService;
    private final GitHubEvidenceService evidenceService;
    private final GitHubWebhookDispatcher dispatcher;

    @Override
    public void handleWebhook(String signatureHeader, String deliveryId, String eventType, byte[] payloadBytes) {
        try {
            Map<String, Object> payload = objectMapper.readValue(new String(payloadBytes, StandardCharsets.UTF_8), Map.class);
            Map<String, Object> repository = (Map<String, Object>) payload.get("repository");
            if (repository == null) return;

            Map<String, Object> owner = (Map<String, Object>) repository.get("owner");
            String repoOwner = owner != null ? (String) owner.get("login") : null;
            String repoName = (String) repository.get("name");
            if (repoOwner == null || repoName == null) return;

            GitHubIntegration matchedIntegration = findIntegration(repoOwner, repoName, payloadBytes, signatureHeader);
            if (matchedIntegration == null) {
                log.warn("Ignoring webhook. No matching integration found for repo: {}/{}", repoOwner, repoName);
                return;
            }

            String decryptedSecret = integrationService.decryptToken(matchedIntegration.getWebhookSecretEncrypted());
            log.debug("Verifying webhook signature. Secret length: {}, Secret preview: {}",
                    decryptedSecret != null ? decryptedSecret.length() : 0,
                    decryptedSecret != null && decryptedSecret.length() > 4 ? decryptedSecret.substring(0, 4) + "****" : "[empty]");

            if (!isValidSignature(payloadBytes, signatureHeader, decryptedSecret)) {
                String computed = generateSignature(payloadBytes, decryptedSecret);
                log.error("Webhook signature mismatch for repo: {}/{}. Header: {}, Computed: {}, Secret used: '[{}]' (length: {})", 
                        repoOwner, repoName, signatureHeader, computed, decryptedSecret, decryptedSecret != null ? decryptedSecret.length() : 0);
                throw new CustomException("Invalid webhook signature", HttpStatus.FORBIDDEN);
            }

            String payloadHash = sha256(payloadBytes);
            String resolvedDeliveryId = hasText(deliveryId) ? deliveryId : eventType + "-" + payloadHash;
            Optional<GitHubWebhookEvent> event = evidenceService.savePendingEvent(
                    matchedIntegration,
                    resolvedDeliveryId,
                    eventType,
                    signatureHeader,
                    payloadHash,
                    payload);
            if (event.isEmpty()) {
                log.info("Ignoring duplicate GitHub webhook delivery: {}", resolvedDeliveryId);
                return;
            }

            dispatcher.dispatch(eventType, payload, matchedIntegration, event.get().getId());
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to handle incoming webhook: ", e);
        }
    }

    /**
     * Finds the GitHubIntegration whose webhook secret produces a valid HMAC-SHA256
     * signature for the incoming payload. This allows multiple DevTrack projects to
     * share the same GitHub repository: each project has its own secret, and we pick
     * the one that actually matches the request signature.
     *
     * Falls back to the first repo-name match when no signature header is present
     * (e.g. internal test pings that skip verification).
     */
    private GitHubIntegration findIntegration(String repoOwner, String repoName,
                                               byte[] payloadBytes, String signatureHeader) {
        List<GitHubIntegration> candidates = gitHubIntegrationRepository.findAll().stream()
                .filter(i -> i.getRepoOwner().equalsIgnoreCase(repoOwner)
                        && i.getRepoName().equalsIgnoreCase(repoName))
                .toList();

        if (candidates.isEmpty()) return null;

        // Try to find the exact project whose secret matches the incoming signature.
        if (hasText(signatureHeader)) {
            for (GitHubIntegration candidate : candidates) {
                String secret = integrationService.decryptToken(candidate.getWebhookSecretEncrypted());
                if (isValidSignature(payloadBytes, signatureHeader, secret)) {
                    return candidate;
                }
            }
        }

        // No signature match — return first candidate (will still fail the strict check below).
        return candidates.get(0);
    }

    private String generateSignature(byte[] payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return "sha256=" + hexString.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isValidSignature(byte[] payload, String signatureHeader, String secret) {
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=") || secret == null) return false;
        String computed = generateSignature(payload, secret);
        return computed != null && computed.equalsIgnoreCase(signatureHeader);
    }

    private String sha256(byte[] payload) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(payload);
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
