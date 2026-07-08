package org.example.backend.dto.testing.config;

import lombok.Data;

@Data
public class ManualTestConfigDto implements TestConfiguration {
    private String type = "MANUAL";
}
