package org.example.backend.dto.testing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.backend.entity.enums.TestType;

@Data
public class AiTestCaseGenerateRequest {
    private TestType testType;

    @NotNull(message = "Requirement is required for AI generation")
    private Long requirementId;
    
    private String additionalContext;

    private boolean smartMode = false;
}
