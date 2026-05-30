package org.example.backend.dto.testing;

import lombok.Data;
import org.example.backend.entity.enums.TestCaseStatus;
import org.example.backend.entity.enums.TestType;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TestCaseResponse {
    private Long id;
    private String code;
    private String title;
    private RequirementShortResponse requirement;
    private TestType type;
    private String precondition;
    private String expectedResult;
    private TestCaseStatus status;
    private List<TestStepResponse> steps;
    private UserShortResponse createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String lastExecutedBy;
    private LocalDateTime lastExecutedAt;
    private String baseUrl;
    private Object stepsStructured;
}
