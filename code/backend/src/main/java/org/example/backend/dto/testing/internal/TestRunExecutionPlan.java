package org.example.backend.dto.testing.internal;

import java.util.List;

public record TestRunExecutionPlan(
    Long testRunId,
    String correlationId,
    List<ExecutionItem> executions
) {
    public record ExecutionItem(
        Long executionId,
        Long testCaseId,
        String testCaseName,
        String status,        // PENDING / RUNNING / PASSED / FAILED / SKIPPED / ABORTED
        int orderIndex,
        List<StepItem> steps
    ) {}

    public record StepItem(
        Long stepId,
        int stepOrder,
        String action,
        String inputData,
        String expectedResult
    ) {}
}
