package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SprintHealthTaskResponse {
    private Long taskId;
    private String taskTitle;
    private String assigneeName;
    private String currentRiskLevel;
    private String predictedRiskLevel;
    private long overdueDays;
    private Long daysUntilDeadline;
    private boolean penaltyApplied;
}
