package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.OllamaProperties;
import org.example.backend.exception.BusinessException;
import org.example.backend.service.LlmProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.ollama.enabled", havingValue = "true")
public class OllamaProvider implements LlmProvider {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final OllamaProperties properties;

    public OllamaProvider(ObjectMapper objectMapper, OllamaProperties properties) {
        this.objectMapper = objectMapper;
        this.properties = properties;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        int timeoutMs = Math.max(properties.getTimeoutMs(), 500);
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public String getProviderName() {
        return "OLLAMA";
    }

    @Override
    public String generateText(String prompt) {
        String baseUrl = trimTrailingSlash(properties.getBaseUrl());
        String model = properties.getModel();
        if (baseUrl == null || baseUrl.isBlank() || model == null || model.isBlank()) {
            throw new BusinessException("Ollama chua duoc cau hinh day du.");
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String jsonResponse = restTemplate.postForObject(baseUrl + "/api/generate", entity, String.class);
            JsonNode responseNode = objectMapper.readTree(jsonResponse).path("response");
            if (responseNode.isMissingNode() || responseNode.asText().isBlank()) {
                throw new BusinessException("Ollama khong tra ve noi dung hop le.");
            }
            return responseNode.asText();
        } catch (RestClientException ex) {
            log.warn("Ollama call failed: {}", ex.getMessage());
            throw new BusinessException("Khong ket noi duoc Ollama: " + ex.getMessage());
        } catch (Exception ex) {
            log.warn("Ollama response parse failed: {}", ex.getMessage());
            throw new BusinessException("Loi khi doc phan hoi Ollama: " + ex.getMessage());
        }
    }

    private String trimTrailingSlash(String value) {
        if (value == null) {
            return null;
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
