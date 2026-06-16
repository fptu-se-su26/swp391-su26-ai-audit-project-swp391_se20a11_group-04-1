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
    
    private List<RequirementAcCoverageSummary> requirementAcCoverage;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RequirementAcCoverageSummary {
        private String acText;
        private String status; // FULLY_COVERED | PARTIAL | NOT_FOUND
        private Long coveredByTaskId;
        private String coveredByTaskCode;
    }
}
