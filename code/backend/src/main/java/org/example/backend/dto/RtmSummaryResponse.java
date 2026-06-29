package org.example.backend.dto;

public record RtmSummaryResponse(
        long totalRequirements,
        long doneCount,
        long inProgressCount,
        long atRiskCount,
        long notStartedCount,
        long totalTasks,
        long completedTasks,
        long totalTests,
        long passedTests,
        long failedTests,
        long openBugs,
        long acceptedEvidence
) {
}
