package org.example.backend.dto.testing.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class IntegrationTestConfigDto implements TestConfiguration {
    private String type = "INTEGRATION";
}
