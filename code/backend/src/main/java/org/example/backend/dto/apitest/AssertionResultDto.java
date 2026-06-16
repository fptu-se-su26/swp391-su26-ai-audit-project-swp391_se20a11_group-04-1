package org.example.backend.dto.apitest;

import lombok.Data;

@Data
public class AssertionResultDto {
    private AssertionDto assertion;
    private boolean passed;
    private String actualValue;
    private String errorMessage;
}
