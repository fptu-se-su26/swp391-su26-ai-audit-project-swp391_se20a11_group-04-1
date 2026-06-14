package org.example.backend.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReqDiffAlignmentResult {
    private List<AlignmentItem> alignmentMatrix;
    private double coverageRatio;
    private int coveredCount;
    private int totalCount;
    private String finalRiskLevel; // LOW, MEDIUM, HIGH, CRITICAL

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AlignmentItem {
        private String acText;
        private String status; // FULLY_COVERED, PARTIAL, NOT_FOUND
        private String evidenceDetail;
        private String feedback;
    }
}
