package org.example.backend.dto.testing.config;

import lombok.Data;

@Data
public class UnitTestConfigDto implements TestConfiguration {
    private String type = "UNIT";
}
