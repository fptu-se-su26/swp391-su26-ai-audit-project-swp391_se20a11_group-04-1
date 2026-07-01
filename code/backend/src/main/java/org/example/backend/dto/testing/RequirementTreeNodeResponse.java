package org.example.backend.dto.testing;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequirementTreeNodeResponse {
    private Long id;
    private String reqCode;
    private String title;
    private String priority;      // HIGH, MEDIUM, LOW
    private int testCaseCount;
    private int passedCount;
    private int failedCount;
    private int notRunCount;
    private int acTotal;          // Total acceptance criteria
    private int acCovered;        // ACs with at least 1 test case
    private int coveragePercent;  // acCovered / acTotal * 100
    private int passRate;         // passedCount / testCaseCount * 100
    private int healthScore;      // (coveragePercent * 0.5) + (passRate * 0.5)
    private String riskLevel;     // LOW, MEDIUM, HIGH, CRITICAL
}
