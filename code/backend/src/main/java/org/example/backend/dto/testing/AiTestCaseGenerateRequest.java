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

    /**
     * If true, the backend will clone the project's GitHub repo backend source,
     * parse Spring Boot controller annotations, and inject real endpoint paths,
     * HTTP methods, request body field names, validation constraints, and expected
     * status codes into the Gemini prompt. Prevents AI from inventing API details.
     *
     * Requires GitHub integration and user token. Adds ~15–30s to generation time
     * on first call (subsequent calls are served from a 30-min Redis cache).
     * Defaults to false (backward compatible).
     */
    private boolean enrichWithApiKnowledge = false;
}
