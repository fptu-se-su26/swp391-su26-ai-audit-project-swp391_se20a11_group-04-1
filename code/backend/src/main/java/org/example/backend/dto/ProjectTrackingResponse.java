package org.example.backend.dto;

import java.util.List;

public record ProjectTrackingResponse(
    int totalMembers,
    int totalTasks,
    int completedTasks,
    double completionPercentage,
    double averageOnTimePercentage,
    double averageQualityScore,
    double totalPoints,
    double totalActualHours,
    List<MemberSummary> members
) {
    public record MemberSummary(
        String name,
        int totalTasks,
        int doneTasks,
        int cancelledTasks,
        double completionPct,
        double onTimePct,
        double estimatedHours,
        double actualHours,
        double avgQuality,
        double totalPoints,
        double contributionPct
    ) {}
}
