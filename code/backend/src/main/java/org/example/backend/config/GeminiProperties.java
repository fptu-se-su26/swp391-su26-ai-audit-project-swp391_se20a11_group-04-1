package org.example.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
@ConfigurationProperties(prefix = "gemini.api")
@Data
public class GeminiProperties {
    private String key;
    private List<String> keys;
    private String url;

    public List<String> getKeys() {
        Set<String> normalized = new LinkedHashSet<>();
        addKeys(normalized, key);
        if (keys != null) {
            keys.forEach(value -> addKeys(normalized, value));
        }
        return new ArrayList<>(normalized);
    }

    private void addKeys(Set<String> target, String value) {
        if (value == null) {
            return;
        }
        for (String token : value.split(",")) {
            String trimmed = token.trim();
            if (!trimmed.isEmpty()) {
                target.add(trimmed);
            }
        }
    }
}
