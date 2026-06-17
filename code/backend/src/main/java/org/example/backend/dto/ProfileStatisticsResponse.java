package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileStatisticsResponse {
    private long totalProjects;
    private long leaderProjects;
    private long memberProjects;
    private long totalAssignedTasks;
    private long completedTasks;
    private long onTimeCompletedTasks;
    private long overdueTasks;
    private long uploadedEvidenceCount;
    private long slaActionCount;
    private long slaWarningCount;
    private long penaltyCount;
    private long approvedRecoveryPlans;
    private long rejectedRecoveryPlans;
}
