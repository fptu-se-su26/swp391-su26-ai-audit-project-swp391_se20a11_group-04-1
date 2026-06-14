package org.example.backend.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightReviewDetailResponse {
    private CodeInsightTaskEvidenceResponse evidence;
    private CodeInsightApprovalGateResponse approvalGate;
    private List<CodeInsightManualEvidenceLinkResponse> manualEvidenceLinks;
    private List<TaskReviewDecisionResponse> decisionHistory;

    private String gateResult;
    private List<GateCheck> gateChecks;
    private String evidenceConfidence;
    private String codeRiskLevel;
}
