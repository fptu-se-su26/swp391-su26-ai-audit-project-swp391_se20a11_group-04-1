package org.example.backend.dto.apitest;

import lombok.Data;

import java.util.Map;

@Data
public class ApiEnvironmentRequest {
    private String name;
    private Map<String, String> variables;
}
