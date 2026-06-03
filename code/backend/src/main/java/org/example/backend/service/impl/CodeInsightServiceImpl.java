package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;
import org.example.backend.entity.GithubRepository;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectCodeInsightSettings;
import org.example.backend.entity.ProjectMember;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.GithubRepositoryRepository;
import org.example.backend.repository.ProjectCodeInsightSettingsRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.service.CodeInsightService;
import org.example.backend.util.WebhookSecretCrypto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CodeInsightServiceImpl implements CodeInsightService {

    private static final Pattern HTTPS_GITHUB_URL = Pattern.compile(
            "^(?:https://)?github\\.com/([^/\\s]+)/([^/\\s]+?)(?:\\.git)?/?$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SSH_GITHUB_URL = Pattern.compile(
            "^git@github\\.com:([^/\\s]+)/([^/\\s]+?)(?:\\.git)?$",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern OWNER_REPO = Pattern.compile(
            "^([^/\\s]+)/([^/\\s]+?)(?:\\.git)?$");

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final GithubRepositoryRepository githubRepositoryRepository;
    private final ProjectCodeInsightSettingsRepository settingsRepository;
    private final WebhookSecretCrypto webhookSecretCrypto;

    @Override
    @Transactional(readOnly = true)
    public CodeInsightConfigResponse getConfig(Long projectId, Long userId) {
        // Read-only endpoint: member access is enough because no secret value is returned.
        requireProjectMember(projectId, userId);
        return toResponse(
                projectId,
                // Repository can be null when the project has not configured GitHub yet.
                githubRepositoryRepository.findByProjectId(projectId).orElse(null),
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

        // Upsert repository config only when a URL is provided, otherwise allow partial setting updates.
        GithubRepository repository = githubRepositoryRepository.findByProjectId(projectId).orElse(null);
        if (hasText(request.getRepoUrl())) {
            ParsedGithubRepository parsed = parseGithubRepository(request.getRepoUrl());
            repository = repository != null ? repository : GithubRepository.builder().project(project).build();
            // Store normalized repository identity so later webhook events can be matched to this project.
            repository.setRepoUrl(parsed.normalizedUrl());
            repository.setOwner(parsed.owner());
            repository.setRepoName(parsed.repoName());
            repository.setDefaultBranch(defaultBranch(request.getDefaultBranch(), repository.getDefaultBranch()));
            repository.setActive(request.getActive() == null || request.getActive());
            repository.setUpdatedAt(LocalDateTime.now());
            if (hasText(request.getWebhookSecret())) {
                // Keep hash for "secret exists/changed" checks and encrypted value for future HMAC verification.
                repository.setWebhookSecretHash(sha256(request.getWebhookSecret().trim()));
                repository.setWebhookSecretEncrypted(webhookSecretCrypto.encrypt(request.getWebhookSecret().trim()));
            }
            repository = githubRepositoryRepository.save(repository);
        } else if (repository != null) {
            // No URL means keep current repository identity and only update editable fields.
            if (hasText(request.getDefaultBranch())) {
                repository.setDefaultBranch(request.getDefaultBranch().trim());
            }
            if (request.getActive() != null) {
                repository.setActive(request.getActive());
            }
            if (hasText(request.getWebhookSecret())) {
                repository.setWebhookSecretHash(sha256(request.getWebhookSecret().trim()));
                repository.setWebhookSecretEncrypted(webhookSecretCrypto.encrypt(request.getWebhookSecret().trim()));
            }
            repository.setUpdatedAt(LocalDateTime.now());
            repository = githubRepositoryRepository.save(repository);
        }

        return toResponse(projectId, repository, settings);
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

    // Parse accepted GitHub URL formats into owner/repo plus a normalized HTTPS URL.
    private ParsedGithubRepository parseGithubRepository(String rawUrl) {
        String value = rawUrl.trim();
        Matcher matcher = HTTPS_GITHUB_URL.matcher(value);
        // Try HTTPS first, then SSH, then short owner/repo for easier manual setup.
        if (!matcher.matches()) {
            matcher = SSH_GITHUB_URL.matcher(value);
        }
        if (!matcher.matches()) {
            matcher = OWNER_REPO.matcher(value);
        }
        if (!matcher.matches()) {
            throw new CustomException("GitHub repository must use github.com/owner/repo format", HttpStatus.BAD_REQUEST);
        }

        String owner = matcher.group(1);
        String repoName = matcher.group(2).replaceAll("\\.git$", "");
        return new ParsedGithubRepository(owner, repoName, "https://github.com/" + owner + "/" + repoName);
    }

    // Prefer user input, then existing DB value, then main as the fallback branch.
    private String defaultBranch(String requested, String current) {
        if (hasText(requested)) {
            return requested.trim();
        }
        if (hasText(current)) {
            return current;
        }
        return "main";
    }

    // Hash webhook secret for metadata checks; encrypted secret is stored separately for HMAC verification.
    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new CustomException("Unable to hash webhook secret", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Merge repository config and settings into one response object for the frontend settings panel.
    private CodeInsightConfigResponse toResponse(
            Long projectId,
            GithubRepository repository,
            ProjectCodeInsightSettings settings) {
        return CodeInsightConfigResponse.builder()
                .projectId(projectId)
                .repository(repository != null ? toRepositoryResponse(repository) : null)
                .settings(toSettingsResponse(settings))
                .build();
    }

    // Expose repository metadata while hiding the raw webhook secret/hash value from API consumers.
    private CodeInsightConfigResponse.GithubRepositoryConfig toRepositoryResponse(GithubRepository repository) {
        return CodeInsightConfigResponse.GithubRepositoryConfig.builder()
                .id(repository.getId())
                .repoUrl(repository.getRepoUrl())
                .owner(repository.getOwner())
                .repoName(repository.getRepoName())
                .defaultBranch(repository.getDefaultBranch())
                .active(repository.isActive())
                .hasWebhookSecret(hasText(repository.getWebhookSecretHash()))
                .lastSyncedAt(repository.getLastSyncedAt())
                .updatedAt(repository.getUpdatedAt())
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

    private record ParsedGithubRepository(String owner, String repoName, String normalizedUrl) {
    }
}
