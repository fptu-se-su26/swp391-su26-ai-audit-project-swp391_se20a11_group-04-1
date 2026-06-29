package org.example.backend.dto.testing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.example.backend.entity.enums.TestType;

import java.util.ArrayList;
import java.util.List;

@Data
public class TestCaseRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotNull(message = "Requirement ID is required")
    private Long requirementId;

    @NotNull(message = "Test type is required")
    private TestType type;

    private String precondition;

    @NotBlank(message = "Expected result is required")
    private String expectedResult;

    @Valid
    private List<TestStepRequest> steps = new ArrayList<>();

    private String baseUrl;
    private Object stepsStructured;
}
