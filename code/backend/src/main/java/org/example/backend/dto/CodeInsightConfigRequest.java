package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightConfigRequest {
    // Payload sent by the Code Insight settings panel when a leader saves review/scoring rules.
    // Repository/webhook configuration is owned by the shared GitHub Integration module.
    private Boolean reviewGateEnabled;
    private Boolean requirePrForDone;
    private Boolean requireCiPass;
    private Boolean aiReviewEnabled;
    private Integer minScoreWarningThreshold;
}
