package org.example.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightConfigResponse {
    private Long projectId;
    private GithubRepositoryConfig repository;
    private CodeInsightSettings settings;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GithubRepositoryConfig {
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
        private Long id;
        private boolean reviewGateEnabled;
        private boolean requirePrForDone;
        private boolean requireCiPass;
        private boolean aiReviewEnabled;
        private int minScoreWarningThreshold;
        private LocalDateTime updatedAt;
    }
}
