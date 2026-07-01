package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.UserGithubToken;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.UserGithubTokenRepository;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.example.backend.service.github.core.GitHubOAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GitHubOAuthServiceImpl implements GitHubOAuthService {

    private final UserAccountRepository userAccountRepository;
    private final UserGithubTokenRepository userGithubTokenRepository;
    private final GitHubIntegrationService integrationService;
    private final RestTemplate restTemplate = new RestTemplate(new org.springframework.http.client.JdkClientHttpRequestFactory());

    @Value("${github.client-id}")
    private String clientId;

    @Value("${github.client-secret}")
    private String clientSecret;

    @Value("${github.redirect-uri}")
    private String redirectUri;

    @Override
    public String getOAuthUrl() {
        return String.format("https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo,read:user&prompt=consent", clientId, redirectUri);
    }

    @Override
    public String exchangeCodeForToken(String code, Long userId) {
        String url = "https://github.com/login/oauth/access_token";
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = new HashMap<>();
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("code", code);
        body.put("redirect_uri", redirectUri);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String accessToken = (String) response.getBody().get("access_token");
                if (accessToken != null) {
                    UserAccount user = userAccountRepository.findById(userId)
                            .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
                    UserGithubToken token = userGithubTokenRepository.findById(userId)
                            .orElse(UserGithubToken.builder().user(user).build());
                    token.setAccessTokenEncrypted(integrationService.encryptToken(accessToken));
                    token.setUpdatedAt(LocalDateTime.now());
                    userGithubTokenRepository.save(token);
                    log.info("GitHub OAuth successful. Access token encrypted and saved for User ID: {}", userId);
                    return "Success";
                }
                throw new CustomException("Failed to retrieve access token from GitHub", HttpStatus.BAD_REQUEST);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error exchanging code for token", e);
            throw new CustomException("Failed to exchange code for token: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
        throw new CustomException("Failed to connect to GitHub", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Override
    public Object getUserRepositories(Long userId) {
        String token = integrationService.getDecryptedUserToken(userId);
        HttpHeaders headers = buildAuthHeaders(token);
        String url = "https://api.github.com/user/repos?sort=updated&per_page=100";
        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to fetch user repositories", e);
            throw new CustomException("Failed to fetch user repositories from GitHub", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Object createRepository(Long userId, String name, String description, boolean isPrivate, boolean autoInit, String gitignoreTemplate, String licenseTemplate) {
        String token = integrationService.getDecryptedUserToken(userId);
        HttpHeaders headers = buildAuthHeaders(token);
        String url = "https://api.github.com/user/repos";

        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        if (description != null && !description.trim().isEmpty()) {
            body.put("description", description);
        }
        body.put("private", isPrivate);
        body.put("auto_init", autoInit);
        
        if (gitignoreTemplate != null && !gitignoreTemplate.trim().isEmpty() && !gitignoreTemplate.equalsIgnoreCase("none")) {
            body.put("gitignore_template", gitignoreTemplate);
        }
        if (licenseTemplate != null && !licenseTemplate.trim().isEmpty() && !licenseTemplate.equalsIgnoreCase("none")) {
            body.put("license_template", licenseTemplate);
        }

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);
            return response.getBody();
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Failed to create GitHub repository. HTTP {}. Body: {}", e.getStatusCode(), errorBody);
            if (errorBody != null && errorBody.contains("already exists")) {
                throw new CustomException("GitHub repository name already exists on your account. Please choose a different name.", HttpStatus.BAD_REQUEST);
            }
            throw new CustomException("Failed to create GitHub repository: " + errorBody, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            log.error("Failed to create GitHub repository", e);
            throw new CustomException("Failed to create GitHub repository", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public String getAccessTokenFromCode(String code) {
        String url = "https://github.com/login/oauth/access_token";
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = new HashMap<>();
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("code", code);
        body.put("redirect_uri", redirectUri);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, new HttpEntity<>(body, headers), Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String accessToken = (String) response.getBody().get("access_token");
                if (accessToken != null) {
                    return accessToken;
                }
            }
        } catch (Exception e) {
            log.error("Error exchanging code for token", e);
            throw new CustomException("Failed to exchange code for token: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
        throw new CustomException("Failed to retrieve access token from GitHub", HttpStatus.BAD_REQUEST);
    }

    @Override
    public Map<String, Object> getGitHubUserProfile(String accessToken) {
        String url = "https://api.github.com/user";
        HttpHeaders headers = buildAuthHeaders(accessToken);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> profile = new HashMap<>();
                Map<?, ?> body = response.getBody();
                profile.put("id", body.get("id"));
                profile.put("login", body.get("login"));
                profile.put("email", body.get("email"));
                profile.put("avatar_url", body.get("avatar_url"));
                profile.put("name", body.get("name"));
                return profile;
            }
        } catch (Exception e) {
            log.error("Failed to fetch user profile from GitHub", e);
            throw new CustomException("Failed to fetch user profile from GitHub: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
        throw new CustomException("Failed to fetch user profile from GitHub", HttpStatus.BAD_REQUEST);
    }

    @Override
    public String getGitHubUserPrimaryEmail(String accessToken) {
        String url = "https://api.github.com/user/emails";
        HttpHeaders headers = buildAuthHeaders(accessToken);
        try {
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), List.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<?> emails = response.getBody();
                for (Object emailObj : emails) {
                    if (emailObj instanceof Map) {
                        Map<?, ?> emailMap = (Map<?, ?>) emailObj;
                        Boolean primary = (Boolean) emailMap.get("primary");
                        if (Boolean.TRUE.equals(primary)) {
                            return (String) emailMap.get("email");
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch user emails from GitHub", e);
        }
        return null;
    }

    private HttpHeaders buildAuthHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Accept", "application/vnd.github+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        return headers;
    }
}
