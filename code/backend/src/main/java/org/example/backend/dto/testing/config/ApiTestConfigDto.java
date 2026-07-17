package org.example.backend.dto.testing.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApiTestConfigDto implements TestConfiguration {
    private String type = "API";
    private String apiMethod;
    private String apiUrl;
    private String apiEndpoint; // Gemini may return apiEndpoint instead of apiUrl
    private Object apiHeaders;
    private Object apiQueryParams;
    private Object apiBody;
    private Object apiAssertions;
    private Object assertions; // alternate field name from AI
    private Object steps;     // AI sometimes includes steps in config
}
