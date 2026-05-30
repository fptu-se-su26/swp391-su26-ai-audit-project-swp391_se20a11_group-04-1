package org.example.backend.dto.request;

import lombok.Data;

@Data
public class RunTestCaseRequest {
    private String environment; // optional override
}
