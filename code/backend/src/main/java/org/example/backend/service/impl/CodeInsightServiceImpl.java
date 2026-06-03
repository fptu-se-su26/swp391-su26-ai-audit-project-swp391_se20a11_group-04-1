package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectCodeInsightSettings;
import org.example.backend.entity.ProjectMember;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.repository.ProjectCodeInsightSettingsRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.service.CodeInsightService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CodeInsightServiceImpl implements CodeInsightService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final GitHubIntegrationRepository gitHubIntegrationRepository;
    private final ProjectCodeInsightSettingsRepository settingsRepository;

    @Override
    @Transactional(readOnly = true)
    public CodeInsightConfigResponse getConfig(Long projectId, Long userId) {
        // Read-only endpoint: member access is enough because no secret value is returned.
        requireProjectMember(projectId, userId);
        return toResponse(
                projectId,
                // GitHub repository config now comes from the shared GitHub Integration module.
                gitHubIntegrationRepository.findByProjectId(projectId).orElse(null),
                // If settings do not exist yet, return safe defaults without writing a row.
                settingsRepository.findByProjectId(projectId).orElse(defaultSettings(null)));
    }

    @Override
    @Transactional
    public CodeInsightConfigResponse updateConfig(Long projectId, CodeInsightConfigRequest request, Long userId) {
        // Updates are leader-only because repo config controls future trusted GitHub evidence.
        ProjectMember member = requireProjectMember(projectId, userId);
        requireProjectLeader(member);

        if (request == null) {
            throw new CustomException("Code Insight configuration is required", HttpStatus.BAD_REQUEST);
        }

        // Load the project entity to attach new config rows through a real FK relationship.
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));

        // Upsert project-level Code Insight settings first; these rules can exist even before a repo is configured.
        ProjectCodeInsightSettings settings = settingsRepository.findByProjectId(projectId)
                .orElseGet(() -> defaultSettings(project));
        applySettings(settings, request);
        settings = settingsRepository.save(settings);

        // Code Insight no longer writes repository/webhook config. That belongs to GitHub Integration.
        GitHubIntegration integration = gitHubIntegrationRepository.findByProjectId(projectId).orElse(null);
        return toResponse(projectId, integration, settings);
    }

    // Verify that the current session user belongs to the project before reading or writing config.
    private ProjectMember requireProjectMember(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You do not have access to this project", HttpStatus.FORBIDDEN));
    }

    // Only project leaders can change the repository and enforcement settings.
    private void requireProjectLeader(ProjectMember member) {
        String roleName = Optional.ofNullable(member.getRole())
                .map(role -> role.getName())
                .orElse("");
        String normalized = roleName.toUpperCase(Locale.ROOT).replace(" ", "_");
        if (!normalized.equals("PROJECT_LEADER") && !normalized.equals("LEADER")) {
            throw new CustomException("Only project leader can update Code Insight configuration", HttpStatus.FORBIDDEN);
        }
    }

    // Build safe default settings used before the project explicitly saves a Code Insight config row.
    private ProjectCodeInsightSettings defaultSettings(Project project) {
        return ProjectCodeInsightSettings.builder()
                .project(project)
                .reviewGateEnabled(true)
                .requirePrForDone(false)
                .requireCiPass(false)
                .aiReviewEnabled(false)
                .minScoreWarningThreshold(70)
                .build();
    }

    // Apply nullable request fields so the frontend can update only part of the settings.
    private void applySettings(ProjectCodeInsightSettings settings, CodeInsightConfigRequest request) {
        if (request.getReviewGateEnabled() != null) {
            settings.setReviewGateEnabled(request.getReviewGateEnabled());
        }
        if (request.getRequirePrForDone() != null) {
            settings.setRequirePrForDone(request.getRequirePrForDone());
        }
        if (request.getRequireCiPass() != null) {
            settings.setRequireCiPass(request.getRequireCiPass());
        }
        if (request.getAiReviewEnabled() != null) {
            settings.setAiReviewEnabled(request.getAiReviewEnabled());
        }
        if (request.getMinScoreWarningThreshold() != null) {
            int threshold = request.getMinScoreWarningThreshold();
            // Clamp at validation level so scoring UI always works with a predictable 0-100 range.
            if (threshold < 0 || threshold > 100) {
                throw new CustomException("Minimum score warning threshold must be between 0 and 100", HttpStatus.BAD_REQUEST);
            }
            settings.setMinScoreWarningThreshold(threshold);
        }
    }

    // Merge repository config and settings into one response object for the frontend settings panel.
    private CodeInsightConfigResponse toResponse(
            Long projectId,
            GitHubIntegration integration,
            ProjectCodeInsightSettings settings) {
        return CodeInsightConfigResponse.builder()
                .projectId(projectId)
                .repository(integration != null ? toRepositoryResponse(integration) : null)
                .settings(toSettingsResponse(settings))
                .build();
    }

    // Expose shared GitHub Integration metadata while hiding encrypted token/secret values.
    private CodeInsightConfigResponse.GithubRepositoryConfig toRepositoryResponse(GitHubIntegration integration) {
        return CodeInsightConfigResponse.GithubRepositoryConfig.builder()
                .id(integration.getId())
                .repoUrl("https://github.com/" + integration.getRepoOwner() + "/" + integration.getRepoName())
                .owner(integration.getRepoOwner())
                .repoName(integration.getRepoName())
                .defaultBranch(null)
                .active(true)
                .hasWebhookSecret(hasText(integration.getWebhookSecretEncrypted()))
                .lastSyncedAt(null)
                .updatedAt(integration.getConnectedAt())
                .build();
    }

    // Convert persisted settings to the frontend-friendly settings block.
    private CodeInsightConfigResponse.CodeInsightSettings toSettingsResponse(ProjectCodeInsightSettings settings) {
        return CodeInsightConfigResponse.CodeInsightSettings.builder()
                .id(settings.getId())
                .reviewGateEnabled(settings.isReviewGateEnabled())
                .requirePrForDone(settings.isRequirePrForDone())
                .requireCiPass(settings.isRequireCiPass())
                .aiReviewEnabled(settings.isAiReviewEnabled())
                .minScoreWarningThreshold(settings.getMinScoreWarningThreshold())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    // Small local helper to avoid repeating null/blank checks around optional config fields.
    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

}
