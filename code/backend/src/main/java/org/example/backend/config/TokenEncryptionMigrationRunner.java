package org.example.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.UserGithubToken;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.repository.UserGithubTokenRepository;
import org.example.backend.service.github.GitHubApiService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * A startup runner that scans the database for any legacy plaintext GitHub tokens or Webhook secrets
 * and encrypts them using the current AES algorithm.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TokenEncryptionMigrationRunner implements CommandLineRunner {

    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final UserGithubTokenRepository userGithubTokenRepository;
    private final GitHubApiService gitHubApiService;

    @Override
    public void run(String... args) {
        log.info("Starting legacy plaintext token migration check...");

        // 1. Migrate Webhook Secrets in GitHubIntegration
        List<GitHubIntegration> integrations = gitHubIntegrationRepository.findAll();
        int migratedIntegrations = 0;
        for (GitHubIntegration integration : integrations) {
            String dbSecret = integration.getWebhookSecretEncrypted();
            if (dbSecret != null && !dbSecret.trim().isEmpty()) {
                // If decrypting it returns null, it means AES decryption failed
                // which proves it is plaintext in the DB.
                boolean isPlaintext = (gitHubApiService.decryptToken(dbSecret) == null);
                if (isPlaintext) {
                    log.info("Found plaintext webhook secret for Project ID: {}. Encrypting...", integration.getProject().getId());
                    integration.setWebhookSecretEncrypted(gitHubApiService.encryptToken(dbSecret));
                    gitHubIntegrationRepository.save(integration);
                    migratedIntegrations++;
                }
            }
        }

        // 2. Migrate Access Tokens in UserGithubToken
        List<UserGithubToken> userTokens = userGithubTokenRepository.findAll();
        int migratedTokens = 0;
        for (UserGithubToken token : userTokens) {
            String dbToken = token.getAccessTokenEncrypted();
            if (dbToken != null && !dbToken.trim().isEmpty()) {
                boolean isPlaintext = (gitHubApiService.decryptToken(dbToken) == null);
                if (isPlaintext) {
                    log.info("Found plaintext access token for User ID: {}. Encrypting...", token.getId());
                    token.setAccessTokenEncrypted(gitHubApiService.encryptToken(dbToken));
                    userGithubTokenRepository.save(token);
                    migratedTokens++;
                }
            }
        }

        if (migratedIntegrations > 0 || migratedTokens > 0) {
            log.info("Successfully encrypted {} legacy webhook secrets and {} legacy access tokens.", migratedIntegrations, migratedTokens);
        } else {
            log.info("All tokens and secrets are securely encrypted. No legacy data found.");
        }
    }
}
