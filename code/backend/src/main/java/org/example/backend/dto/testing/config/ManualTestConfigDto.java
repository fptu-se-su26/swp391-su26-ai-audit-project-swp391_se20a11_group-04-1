package org.example.backend.dto.testing.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ManualTestConfigDto implements TestConfiguration {
    private String type = "MANUAL";
}
