package org.example.backend.dto.testing.config;

import lombok.Data;

@Data
public class IntegrationTestConfigDto implements TestConfiguration {
    private String type = "INTEGRATION";
}
