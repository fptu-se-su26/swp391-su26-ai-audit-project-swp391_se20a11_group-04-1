package org.example.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "openrouter.api")
@Data
public class OpenRouterProperties {
    private List<String> keys;
    private String url;
    private String model;
    private Integer maxTokens = 8192;
}
