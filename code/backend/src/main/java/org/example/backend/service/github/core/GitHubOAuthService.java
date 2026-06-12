package org.example.backend.service.github.core;

public interface GitHubOAuthService {
    String getOAuthUrl();

    String exchangeCodeForToken(String code, Long userId);

    Object getUserRepositories(Long userId);

    Object createRepository(Long userId, String name, String description, boolean isPrivate);
}
