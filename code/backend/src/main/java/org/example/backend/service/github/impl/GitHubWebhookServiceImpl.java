package org.example.backend.service.github.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.example.backend.service.github.core.GitHubWebhookDispatcher;
import org.example.backend.service.github.core.GitHubWebhookService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GitHubWebhookServiceImpl implements GitHubWebhookService {

    private final ObjectMapper objectMapper;
    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final GitHubIntegrationService integrationService;
    private final GitHubWebhookDispatcher dispatcher;

    @Override
    public void handleWebhook(String signatureHeader, String eventType, byte[] payloadBytes) {
        if (!"issues".equalsIgnoreCase(eventType) && !"ping".equalsIgnoreCase(eventType)) {
            log.debug("Ignored unsupported GitHub webhook event: {}", eventType);
            return;
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(new String(payloadBytes, StandardCharsets.UTF_8), Map.class);
            Map<String, Object> repository = (Map<String, Object>) payload.get("repository");
            if (repository == null) return;

            Map<String, Object> owner = (Map<String, Object>) repository.get("owner");
            String repoOwner = owner != null ? (String) owner.get("login") : null;
            String repoName = (String) repository.get("name");
            if (repoOwner == null || repoName == null) return;

            GitHubIntegration matchedIntegration = findIntegration(repoOwner, repoName);
            if (matchedIntegration == null) {
                log.warn("Ignoring webhook. No matching integration found for repo: {}/{}", repoOwner, repoName);
                return;
            }

            String decryptedSecret = integrationService.decryptToken(matchedIntegration.getWebhookSecretEncrypted());
            log.debug("Verifying webhook signature. Secret length: {}, Secret preview: {}",
                    decryptedSecret != null ? decryptedSecret.length() : 0,
                    decryptedSecret != null && decryptedSecret.length() > 4 ? decryptedSecret.substring(0, 4) + "****" : "[empty]");

            if (!isValidSignature(payloadBytes, signatureHeader, decryptedSecret)) {
                log.error("Webhook signature mismatch for repo: {}/{}. Header: {}", repoOwner, repoName,
                        signatureHeader != null ? signatureHeader.substring(0, Math.min(20, signatureHeader.length())) + "..." : "null");
                throw new CustomException("Invalid webhook signature", HttpStatus.FORBIDDEN);
            }

            dispatcher.dispatch(eventType, payload, matchedIntegration);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to handle incoming webhook: ", e);
        }
    }

    private GitHubIntegration findIntegration(String repoOwner, String repoName) {
        List<GitHubIntegration> integrations = gitHubIntegrationRepository.findAll();
        return integrations.stream()
                .filter(integration -> integration.getRepoOwner().equalsIgnoreCase(repoOwner)
                        && integration.getRepoName().equalsIgnoreCase(repoName))
                .findFirst()
                .orElse(null);
    }

    private boolean isValidSignature(byte[] payload, String signatureHeader, String secret) {
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=") || secret == null) return false;
        String signature = signatureHeader.substring(7);
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
            return hexString.toString().equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("Failed to verify webhook signature: ", e);
            return false;
        }
    }
}
