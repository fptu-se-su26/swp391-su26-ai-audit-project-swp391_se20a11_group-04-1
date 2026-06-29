package org.example.backend.dto.testing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TestStepRequest {
    private Integer stepNumber;

    @NotBlank(message = "Step description is required")
    private String description;
}
