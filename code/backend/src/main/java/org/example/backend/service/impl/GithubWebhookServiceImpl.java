package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.GithubWebhookResponse;
import org.example.backend.entity.GithubRepository;
import org.example.backend.entity.GithubWebhookEvent;
import org.example.backend.entity.GithubWebhookProcessingStatus;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.GithubRepositoryRepository;
import org.example.backend.repository.GithubWebhookEventRepository;
import org.example.backend.service.GithubWebhookService;
import org.example.backend.util.WebhookSecretCrypto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class GithubWebhookServiceImpl implements GithubWebhookService {

    private static final String SIGNATURE_PREFIX = "sha256=";

    private final GithubRepositoryRepository githubRepositoryRepository;
    private final GithubWebhookEventRepository webhookEventRepository;
    private final ObjectMapper objectMapper;
    private final WebhookSecretCrypto webhookSecretCrypto;

    @Override
    @Transactional
    public GithubWebhookResponse receiveWebhook(String eventType, String deliveryId, String signature, String payload) {
        // Duplicate delivery means GitHub retried the same event; return success without storing again.
        if (deliveryId == null || deliveryId.trim().isEmpty()) {
            throw new CustomException("Missing X-GitHub-Delivery header", HttpStatus.BAD_REQUEST);
        }
        if (webhookEventRepository.existsByDeliveryId(deliveryId)) {
            return webhookEventRepository.findByDeliveryId(deliveryId)
                    .map(event -> toResponse(event, true))
                    .orElseThrow(() -> new CustomException("Duplicate webhook lookup failed", HttpStatus.CONFLICT));
        }

        JsonNode payloadRoot = parsePayload(payload);
        RepositoryIdentity identity = parseRepositoryIdentity(payloadRoot);
        GithubRepository repository = githubRepositoryRepository
                .findByOwnerIgnoreCaseAndRepoNameIgnoreCaseAndActiveTrue(identity.owner(), identity.repoName())
                .orElseThrow(() -> new CustomException("GitHub repository is not configured for this project", HttpStatus.NOT_FOUND));

        // Signature verification must happen before saving trusted raw evidence.
        verifySignature(repository, signature, payload);

        GithubWebhookEvent event = webhookEventRepository.save(GithubWebhookEvent.builder()
                .repository(repository)
                .deliveryId(deliveryId)
                .eventType(requiredHeader(eventType, "Missing X-GitHub-Event header"))
                .signature(signature)
                .payloadHash(sha256(payload))
                .payloadJson(payload)
                .processedStatus(GithubWebhookProcessingStatus.PENDING)
                .receivedAt(LocalDateTime.now())
                .build());
        return toResponse(event, false);
    }

    private JsonNode parsePayload(String payload) {
        // Parse JSON only enough to identify the repository; full normalization comes later.
        try {
            return objectMapper.readTree(payload);
        } catch (Exception ex) {
            throw new CustomException("Invalid GitHub webhook JSON payload", HttpStatus.BAD_REQUEST);
        }
    }

    private RepositoryIdentity parseRepositoryIdentity(JsonNode root) {
        JsonNode repository = root.path("repository");
        String repoName = repository.path("name").asText(null);
        String owner = repository.path("owner").path("login").asText(null);
        if (owner == null || owner.isBlank()) {
            owner = repository.path("owner").path("name").asText(null);
        }
        if (owner == null || owner.isBlank() || repoName == null || repoName.isBlank()) {
            throw new CustomException("GitHub payload does not contain repository owner/name", HttpStatus.BAD_REQUEST);
        }
        return new RepositoryIdentity(owner, repoName);
    }

    private void verifySignature(GithubRepository repository, String signature, String payload) {
        if (signature == null || !signature.startsWith(SIGNATURE_PREFIX)) {
            throw new CustomException("Missing or invalid GitHub signature header", HttpStatus.FORBIDDEN);
        }
        String encryptedSecret = repository.getWebhookSecretEncrypted();
        if (encryptedSecret == null || encryptedSecret.isBlank()) {
            throw new CustomException("Webhook secret is not configured for this repository", HttpStatus.FORBIDDEN);
        }

        String secret = webhookSecretCrypto.decrypt(encryptedSecret);
        String expected = SIGNATURE_PREFIX + hmacSha256(secret, payload);
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8))) {
            throw new CustomException("GitHub webhook signature verification failed", HttpStatus.FORBIDDEN);
        }
    }

    private String hmacSha256(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new CustomException("Unable to verify GitHub webhook signature", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new CustomException("Unable to hash webhook payload", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String requiredHeader(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new CustomException(message, HttpStatus.BAD_REQUEST);
        }
        return value.trim();
    }

    private GithubWebhookResponse toResponse(GithubWebhookEvent event, boolean duplicate) {
        return GithubWebhookResponse.builder()
                .eventId(event.getId())
                .deliveryId(event.getDeliveryId())
                .eventType(event.getEventType())
                .status(event.getProcessedStatus() != null ? event.getProcessedStatus().name() : null)
                .duplicate(duplicate)
                .receivedAt(event.getReceivedAt())
                .build();
    }

    private record RepositoryIdentity(String owner, String repoName) {
    }
}
