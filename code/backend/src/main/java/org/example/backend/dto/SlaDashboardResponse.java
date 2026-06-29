package org.example.backend.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaDashboardResponse {
    private int progressPercent;
    private int overdueCount;
    private int testRatePercent;
    private int evidenceRatePercent;
    private int missingEvidenceCount;
    private int dueSoonCount;
    private int frozenTaskCount;
    private int penaltyCount;
    private List<SlaFlagResponse> flags;
    private List<SlaViolationResponse> violations;
}
