package org.example.backend.dto.testing.internal;

import jakarta.validation.constraints.NotNull;

public record UpdateTestRunStatusRequest(
    @NotNull String status,   // "RUNNING" | "COMPLETED" | "SYSTEM_ERROR"
    String notes
) {}
