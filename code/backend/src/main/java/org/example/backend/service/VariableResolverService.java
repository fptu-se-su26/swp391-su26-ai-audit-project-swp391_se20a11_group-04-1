package org.example.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class VariableResolverService {

    private final ObjectMapper objectMapper;
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{([^}]+)}}");

    public String resolveVariables(String text, String variablesJson) {
        if (text == null || variablesJson == null || text.isBlank() || variablesJson.isBlank()) {
            return text;
        }

        try {
            JsonNode root = objectMapper.readTree(variablesJson);
            if (!root.isObject()) {
                return text;
            }
            Map<String, String> variables = new HashMap<>();
            root.fields().forEachRemaining(entry -> {
                JsonNode valueNode = entry.getValue();
                String value = "";
                if (valueNode != null && !valueNode.isNull()) {
                    value = valueNode.isTextual() ? valueNode.asText() : valueNode.toString();
                }
                variables.put(entry.getKey(), value);
            });
            return resolveVariables(text, variables);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse variables JSON", e);
            return text;
        }
    }

    public String resolveVariables(String text, Map<String, String> variables) {
        if (text == null || variables == null || variables.isEmpty()) {
            return text;
        }

        Matcher matcher = VARIABLE_PATTERN.matcher(text);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String varName = matcher.group(1).trim();
            String varValue = variables.getOrDefault(varName, matcher.group(0));
            matcher.appendReplacement(sb, Matcher.quoteReplacement(varValue));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
