package org.example.backend.dto.testing.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UnitTestConfigDto implements TestConfiguration {
    private String type = "UNIT";
}
