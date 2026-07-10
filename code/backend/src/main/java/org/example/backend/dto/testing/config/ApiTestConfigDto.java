package org.example.backend.dto.testing.config;

import lombok.Data;

@Data
public class ApiTestConfigDto implements TestConfiguration {
    private String type = "API";
    private String apiMethod;
    private String apiUrl;
    private Object apiHeaders;
    private Object apiQueryParams;
    private Object apiBody;
    private Object apiAssertions;
}
