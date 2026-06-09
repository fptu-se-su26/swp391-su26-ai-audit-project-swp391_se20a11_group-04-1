package org.example.backend.dto.testing.ws;

import lombok.Builder;
import java.util.List;

@Builder
public record TestRunProgressEvent(
    String type,
    Long testRunId,
    Long testExecutionId,
    Long testCaseId,
    String testCaseName,
    String status,
    String finalStatus,
    String notes,
    String screenshotUrl,
    Long durationMs,
    Integer completedCount,
    Integer totalCount,
    Integer passedCount,
    Integer failedCount,
    Integer skippedCount,
    Integer abortedCount,
    Long totalDurationMs,
    String correlationId,
    Integer failedStepIndex,
    List<String> evidenceUrls
) {}
