package org.example.backend.dto.testing;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateTestRunRequest(
    @NotNull Long projectId,
    @NotEmpty @Size(min = 1, max = 100) List<Long> testCaseIds,
    @Size(max = 200) String name
) {}
