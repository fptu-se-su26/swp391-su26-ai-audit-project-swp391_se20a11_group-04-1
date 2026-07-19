package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.OpenRouterProperties;
import org.example.backend.exception.BusinessException;
import org.example.backend.service.LlmProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
public class OpenRouterProvider implements LlmProvider {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final OpenRouterProperties openRouterProperties;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);

    @Value("${app.api-base-url:http://localhost:8080}")
    private String appApiBaseUrl;

    @Autowired
    public OpenRouterProvider(RestTemplate restTemplate, ObjectMapper objectMapper, OpenRouterProperties openRouterProperties) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.openRouterProperties = openRouterProperties;
    }

    @Override
    public String getProviderName() {
        return "OPENROUTER";
    }

    @Override
    public String generateText(String prompt) {
        List<String> keys = openRouterProperties.getKeys();
        if (keys == null || keys.isEmpty() || keys.get(0).contains("YOUR_OPENROUTER_KEY")) {
            throw new BusinessException("OpenRouter API Key chưa được cấu hình.");
        }

        int maxRetries = Math.max(keys.size() * 3, 10);
        int backoff503 = 2000;
        int backoff429 = 1000;
        int error503Count = 0;

        String targetUrl = openRouterProperties.getUrl();
        String model = openRouterProperties.getModel();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model != null ? model : "google/gemini-2.5-flash:free");
        
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
            // OpenRouter recommends passing HTTP-Referer and X-Title
            headers.set("HTTP-Referer", appApiBaseUrl);
            headers.set("X-Title", "DevTrack AI Audit");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            try {
                String jsonResponse = restTemplate.postForObject(targetUrl, entity, String.class);
                JsonNode rootNode = objectMapper.readTree(jsonResponse);
                JsonNode contentNode = rootNode.path("choices").get(0).path("message").path("content");
                
                if (contentNode.isMissingNode()) {
                    throw new BusinessException("Không nhận được kết quả hợp lệ từ OpenRouter.");
                }
                
                return contentNode.asText();
            } catch (HttpStatusCodeException httpException) {
                int statusCode = httpException.getStatusCode().value();
                String errorBody = httpException.getResponseBodyAsString().toLowerCase();
                log.error("OpenRouter API HTTP Error {}: {}", statusCode, errorBody);
                
                if (statusCode == 401) {
                    log.warn("OpenRouter API {} for key ending in {}. Bỏ qua...", statusCode, apiKey.substring(Math.max(0, apiKey.length() - 4)));
                } else if (statusCode == 429) {
                    if (errorBody.contains("quota") || errorBody.contains("insufficient") || errorBody.contains("balance")) {
                        log.warn("OpenRouter API Key kết thúc bằng {} đã hết Quota (RPD). Bỏ qua...", apiKey.substring(Math.max(0, apiKey.length() - 4)));
                    } else {
                        log.warn("OpenRouter API bị Rate Limit (RPM). Nghỉ ngơi {}ms...", backoff429);
                        try { Thread.sleep(backoff429); } catch (InterruptedException ignored) {}
                        backoff429 = Math.min(backoff429 * 2, 8000);
                    }
                } else if (statusCode == 503 || statusCode == 500) {
                    error503Count++;
                    log.warn("OpenRouter API {} Error. Exponential Backoff: đợi {}ms...", statusCode, backoff503);
                    if (error503Count >= 3) {
                        throw new BusinessException("OpenRouter API is currently overloaded (" + statusCode + "). Failing fast to fallback.");
                    }
                    if (i == maxRetries - 1) {
                        throw new BusinessException("OpenRouter API Overloaded (" + statusCode + ").");
                    }
                    try { Thread.sleep(backoff503); } catch (InterruptedException ignored) {}
                    backoff503 = Math.min(backoff503 * 2, 8000); // Tối đa đợi 8s
                } else {
                    throw new BusinessException("Lỗi kết nối OpenRouter API: " + statusCode);
                }
            } catch (Exception e) {
                log.error("OpenRouter API Exception", e);
                throw new BusinessException("Lỗi hệ thống khi gọi OpenRouter: " + e.getMessage());
            }
        }
        throw new BusinessException("Không thể generate text qua OpenRouter sau nhiều lần thử.");
    }
}
