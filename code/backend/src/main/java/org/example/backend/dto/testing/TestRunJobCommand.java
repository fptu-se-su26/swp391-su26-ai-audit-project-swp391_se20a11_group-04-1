package org.example.backend.dto.testing;

import lombok.Builder;

import java.time.Instant;

@Builder
public record TestRunJobCommand(
    Long testRunId,
    Long projectId,
    Long triggeredByUserId,
    String correlationId,
    Instant timestamp
) {}
