package org.example.backend.dto.testing.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UiTestConfigDto implements TestConfiguration {
    private String type = "UI";
    private String baseUrl;
    private Object steps;
    private String cachedPlaywrightScript;
    private String scriptSource;
    private String scriptGeneratedAt;
}
