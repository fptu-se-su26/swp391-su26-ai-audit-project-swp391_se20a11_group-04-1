package org.example.backend.dto.testing.config;

import lombok.Data;

@Data
public class UiTestConfigDto implements TestConfiguration {
    private String type = "UI";
    private String baseUrl;
    private Object steps;
    private String cachedPlaywrightScript;
    private String scriptSource;
    private String scriptGeneratedAt;
}
