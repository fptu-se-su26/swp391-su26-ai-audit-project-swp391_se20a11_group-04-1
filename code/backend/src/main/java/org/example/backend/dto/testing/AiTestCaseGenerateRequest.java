package org.example.backend.dto.testing;

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

    private boolean discardExisting = false;

    /**
     * If true, the backend will clone the project's GitHub repo and extract
     * real frontend selectors (data-testid, id, name, aria-label, placeholder)
     * to enrich the Gemini prompt, producing more accurate UI test case selectors.
     * Requires the project to have a GitHub integration and the user to have a GitHub token.
     * Defaults to false (backward compatible).
     */
    private boolean enrichWithSelectors = false;
}
