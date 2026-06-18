package org.example.backend.dto.testing;

import java.time.LocalDateTime;
import java.util.List;

public record TestRunStatusResponse(
    Long testRunId,
    String status,
    String correlationId,
    int totalTestCases,
    int completedCount,
    int passedCount,
    int failedCount,
    int skippedCount,
    int abortedCount,
    LocalDateTime startedAt,
    LocalDateTime completedAt,
    String errorMessage,
    Long bugReportId,
    Boolean isSaved,
    List<ExecutionStatusItem> executions
) {
    public record ExecutionStatusItem(
        Long executionId,
        Long testCaseId,
        String testCaseName,
        String status,
        String notes,
        String screenshotUrl,
        Long durationMs,
        int orderIndex,
        Integer failedStepIndex,
        List<String> evidenceUrls
    ) {}
}
