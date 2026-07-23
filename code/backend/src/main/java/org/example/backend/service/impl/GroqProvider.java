package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.GroqProperties;
import org.example.backend.exception.BusinessException;
import org.example.backend.service.LlmProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class GroqProvider implements LlmProvider {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GroqProperties groqProperties;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);

    @Autowired
    public GroqProvider(RestTemplate restTemplate, ObjectMapper objectMapper, GroqProperties groqProperties) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.groqProperties = groqProperties;
    }

    @Override
    public String getProviderName() {
        return "GROQ";
    }

    @Override
    public String generateText(String prompt) {
        List<String> keys = groqProperties.getKeys();
        if (keys == null || keys.isEmpty() || keys.get(0).contains("YOUR_GROQ_KEY")) {
            throw new BusinessException("Groq API Key chưa được cấu hình.");
        }

        int maxRetries = Math.max(keys.size() * 3, 10);
        int backoff503 = 2000;
        int backoff429 = 1000;
        int error503Count = 0;

        String targetUrl = groqProperties.getUrl();
        String model = groqProperties.getModel();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model != null ? model : "llama-3.3-70b-versatile");
        requestBody.put("temperature", 0.1);
        requestBody.put("max_tokens", boundedMaxTokens(groqProperties.getMaxTokens()));
        
        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);
        requestBody.put("messages", List.of(message));

        for (int i = 0; i < maxRetries; i++) {
            int index = currentKeyIndex.getAndUpdate(idx -> (idx + 1) % keys.size());
            String apiKey = keys.get(index);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            try {
                String jsonResponse = restTemplate.postForObject(targetUrl, entity, String.class);
                JsonNode rootNode = objectMapper.readTree(jsonResponse);
                JsonNode contentNode = rootNode.path("choices").get(0).path("message").path("content");
                
                if (contentNode.isMissingNode()) {
                    throw new BusinessException("Không nhận được kết quả hợp lệ từ Groq.");
                }
                
                return contentNode.asText();
            } catch (HttpStatusCodeException httpException) {
                int statusCode = httpException.getStatusCode().value();
                String errorBody = httpException.getResponseBodyAsString().toLowerCase();
                log.error("Groq API HTTP Error {}: {}", statusCode, errorBody);
                
                if (statusCode == 401) {
                    log.warn("Groq API {} for key ending in {}. Bỏ qua...", statusCode, apiKey.substring(Math.max(0, apiKey.length() - 4)));
                } else if (statusCode == 429) {
                    if (errorBody.contains("quota") || errorBody.contains("insufficient") || errorBody.contains("billing")) {
                        log.warn("Groq API Key kết thúc bằng {} đã hết Quota (RPD). Bỏ qua...", apiKey.substring(Math.max(0, apiKey.length() - 4)));
                    } else {
                        log.warn("Groq API bị Rate Limit (RPM). Nghỉ ngơi {}ms...", backoff429);
                        try { Thread.sleep(backoff429); } catch (InterruptedException ignored) {}
                        backoff429 = Math.min(backoff429 * 2, 8000);
                    }
                } else if (statusCode == 503 || statusCode == 500) {
                    error503Count++;
                    log.warn("Groq API {} Error. Exponential Backoff: đợi {}ms...", statusCode, backoff503);
                    if (error503Count >= 3) {
                        throw new BusinessException("Groq API is currently overloaded (" + statusCode + "). Failing fast to fallback.");
                    }
                    if (i == maxRetries - 1) {
                        throw new BusinessException("Groq API Overloaded (" + statusCode + ").");
                    }
                    try { Thread.sleep(backoff503); } catch (InterruptedException ignored) {}
                    backoff503 = Math.min(backoff503 * 2, 8000); // Tối đa đợi 8s
                } else {
                    throw new BusinessException("Lỗi kết nối Groq API: " + statusCode);
                }
            } catch (Exception e) {
                log.error("Groq API Exception", e);
                throw new BusinessException("Lỗi hệ thống khi gọi Groq: " + e.getMessage());
            }
        }
        throw new BusinessException("Không thể generate text qua Groq sau nhiều lần thử.");
    }

    private int boundedMaxTokens(Integer configuredMaxTokens) {
        if (configuredMaxTokens == null || configuredMaxTokens <= 0) {
            return 16384;
        }
        return Math.max(1024, Math.min(configuredMaxTokens, 16384));
    }
}
