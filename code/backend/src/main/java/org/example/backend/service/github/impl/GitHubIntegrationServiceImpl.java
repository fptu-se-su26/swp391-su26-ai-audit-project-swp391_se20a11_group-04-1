package org.example.backend.service.github.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectMember;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.UserGithubTokenRepository;
import org.example.backend.service.EncryptionService;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class GitHubIntegrationServiceImpl implements GitHubIntegrationService {

    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final UserGithubTokenRepository userGithubTokenRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserAccountRepository userAccountRepository;
    private final EncryptionService encryptionService;

    @Override
    @Transactional(readOnly = true)
    public GitHubIntegration getIntegration(Long projectId, Long userId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        return gitHubIntegrationRepository.findByProjectId(projectId).orElse(null);
    }

    @Override
    public GitHubIntegration saveIntegration(Long projectId, Map<String, Object> request, Long userId) {
        ProjectMember caller = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        if (!isLeaderRole(caller.getRole().getName())) {
            throw new CustomException("Only Project Leaders are authorized to configure GitHub integration.", HttpStatus.FORBIDDEN);
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        String repoOwner = (String) request.get("repoOwner");
        String repoName = (String) request.get("repoName");
        String webhookSecret = (String) request.get("webhookSecret");

        if (repoOwner == null || repoOwner.trim().isEmpty()) {
            throw new CustomException("Repository Owner is required", HttpStatus.BAD_REQUEST);
        }
        if (repoName == null || repoName.trim().isEmpty()) {
            throw new CustomException("Repository Name is required", HttpStatus.BAD_REQUEST);
        }

        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId)
                .orElse(GitHubIntegration.builder().project(project).build());

        integration.setRepoOwner(repoOwner.trim());
        integration.setRepoName(repoName.trim());
        integration.setConnectedBy(user);

        if (webhookSecret != null && !webhookSecret.trim().isEmpty()) {
            integration.setWebhookSecretEncrypted(encryptToken(webhookSecret.trim()));
        } else if (integration.getWebhookSecretEncrypted() == null) {
            String randomSecret = java.util.UUID.randomUUID().toString().replace("-", "") + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            integration.setWebhookSecretEncrypted(encryptToken(randomSecret));
        }

        if (!hasUserToken(userId)) {
            throw new CustomException("You must link your GitHub account first.", HttpStatus.BAD_REQUEST);
        }

        return gitHubIntegrationRepository.save(integration);
    }

    @Override
    public boolean hasUserToken(Long userId) {
        return userGithubTokenRepository.findById(userId).isPresent();
    }

    @Override
    public String encryptToken(String plaintext) {
        return encryptionService.encrypt(plaintext);
    }

    @Override
    public String decryptToken(String encrypted) {
        return encryptionService.decrypt(encrypted);
    }

    @Override
    public String getDecryptedUserToken(Long userId) {
        return userGithubTokenRepository.findById(userId)
                .map(token -> decryptToken(token.getAccessTokenEncrypted()))
                .orElseThrow(() -> new CustomException("No GitHub token configured for this user", HttpStatus.BAD_REQUEST));
    }

    private boolean isLeaderRole(String roleName) {
        return roleName != null && roleName.toUpperCase().contains("LEADER");
    }
}
