package org.example.backend.service.github.core;

import org.example.backend.entity.GitHubIntegration;

import java.util.Map;

public interface GitHubIntegrationService {
    GitHubIntegration getIntegration(Long projectId, Long userId);

    GitHubIntegration saveIntegration(Long projectId, Map<String, Object> request, Long userId);

    boolean hasUserToken(Long userId);

    String encryptToken(String plaintext);

    String decryptToken(String encrypted);

    String getDecryptedUserToken(Long userId);
}
