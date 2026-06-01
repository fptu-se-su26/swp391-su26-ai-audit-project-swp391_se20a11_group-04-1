package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightConfigRequest {
    // Payload sent by the Code Insight settings panel when a leader saves repository/rule config.
    private String repoUrl;
    private String defaultBranch;
    private String webhookSecret;
    private Boolean active;
    private Boolean reviewGateEnabled;
    private Boolean requirePrForDone;
    private Boolean requireCiPass;
    private Boolean aiReviewEnabled;
    private Integer minScoreWarningThreshold;
}
