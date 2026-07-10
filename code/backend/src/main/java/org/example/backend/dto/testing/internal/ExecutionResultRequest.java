package org.example.backend.dto.testing.internal;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ExecutionResultRequest(
        @NotNull Long testExecutionId,
        @NotNull Long testCaseId,
        @NotNull String idempotencyKey, // BẮT BUỘC: "{testRunId}-{testCaseId}"
        @NotNull String outcome, // "PASSED" | "FAILED" | "SKIPPED"
        String notes,
        String screenshotUrl,
        Long durationMs,
        Integer failedStepIndex,
        List<String> evidenceUrls) {
}
