package org.example.backend.dto.testing;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class AnalyzeCoverageRequest {
    @NotNull(message = "Requirement ID cannot be null")
    private Long requirementId;
}
