package org.example.backend.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightApprovalGateResponse {
    private String approvalStatus;
    private String riskLevel;
    private int score;
    private List<String> blockers;
    private List<String> warnings;
}
