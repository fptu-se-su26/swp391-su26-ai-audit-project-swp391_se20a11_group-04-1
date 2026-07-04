package org.example.backend.service.github.core;

public interface GitHubOAuthService {
    String getOAuthUrl();

    String exchangeCodeForToken(String code, Long userId);

    String getAccessTokenFromCode(String code);

    java.util.Map<String, Object> getGitHubUserProfile(String accessToken);

    String getGitHubUserPrimaryEmail(String accessToken);

    Object getUserRepositories(Long userId);

    Object createRepository(Long userId, String name, String description, boolean isPrivate, boolean autoInit, String gitignoreTemplate, String licenseTemplate);
}
