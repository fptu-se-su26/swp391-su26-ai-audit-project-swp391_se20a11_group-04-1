package org.example.backend.dto.apitest;

import lombok.Data;

import java.util.Map;

@Data
public class ApiEnvironmentResponse {
    private Long id;
    private Long projectId;
    private String name;
    private Map<String, String> variables;
}
