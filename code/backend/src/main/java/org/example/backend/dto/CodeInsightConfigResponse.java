package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightConfigResponse {
    // Combined config response so the frontend can render repository status and review rules together.
    private Long projectId;
    private GithubRepositoryConfig repository;
    private CodeInsightSettings settings;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GithubRepositoryConfig {
        // Repository metadata exposed to the UI; raw webhook secret/hash is intentionally hidden.
        private Long id;
        private String repoUrl;
        private String owner;
        private String repoName;
        private String defaultBranch;
        private boolean active;
        private boolean hasWebhookSecret;
        private LocalDateTime lastSyncedAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CodeInsightSettings {
        // Review/scoring switches that control how strict Code Insight should be for this project.
        private Long id;
        private boolean reviewGateEnabled;
        private boolean requirePrForDone;
        private boolean requireCiPass;
        private boolean aiReviewEnabled;
        private int minScoreWarningThreshold;
        private LocalDateTime updatedAt;
    }
}
