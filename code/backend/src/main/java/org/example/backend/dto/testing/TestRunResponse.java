package org.example.backend.dto.testing;

import lombok.Builder;

@Builder
public record TestRunResponse(
    Long testRunId,
    String status,
    String correlationId
) {}
