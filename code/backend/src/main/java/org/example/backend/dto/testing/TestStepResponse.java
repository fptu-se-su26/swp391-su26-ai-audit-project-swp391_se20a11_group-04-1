package org.example.backend.dto.testing;

import lombok.Data;

@Data
public class TestStepResponse {
    private Long id;
    private Integer stepNumber;
    private String description;
}
