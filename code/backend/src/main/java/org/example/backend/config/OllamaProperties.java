package org.example.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.ollama")
@Data
public class OllamaProperties {
    private boolean enabled;
    private String baseUrl;
    private String model;
    private int timeoutMs;
}
