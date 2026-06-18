package org.example.backend.dto.testing.internal;

import jakarta.validation.constraints.NotNull;

public record StartExecutionRequest(
    @NotNull Long testExecutionId,
    @NotNull Long testCaseId
) {}
