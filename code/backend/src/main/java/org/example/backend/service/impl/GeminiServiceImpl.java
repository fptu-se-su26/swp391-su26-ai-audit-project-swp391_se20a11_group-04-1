package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import org.example.backend.exception.BusinessException;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import org.example.backend.config.GeminiProperties;
import org.example.backend.service.LlmProvider;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GeminiServiceImpl implements GeminiService, LlmProvider {

    private static final String DEFAULT_GENERATE_CONTENT_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiProperties geminiProperties;
    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);

    @Autowired
    public GeminiServiceImpl(RestTemplate restTemplate, ObjectMapper objectMapper, GeminiProperties geminiProperties) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.geminiProperties = geminiProperties;
    }

    @Override
    public String getProviderName() {
        return "GEMINI";
    }

    @Override
    public String generateText(String prompt) {
        return callGeminiApi(prompt);
    }

    private String callGeminiApi(String prompt) {
        String targetUrl = normalizeTargetUrl(geminiProperties.getUrl());
        if (targetUrl == null || targetUrl.isEmpty()) {
            throw new BusinessException("Chưa cấu hình URL (gemini.api.url) trong application.yaml");
        }

        List<String> keys = geminiProperties.getKeys().stream()
                .filter(key -> key != null && !key.isBlank())
                .filter(key -> !"disabled".equalsIgnoreCase(key.trim()))
                .filter(key -> !"replace_me".equalsIgnoreCase(key.trim()))
                .filter(key -> !key.contains("YOUR_GEMINI"))
                .toList();
        if (keys == null || keys.isEmpty()) {
            throw new BusinessException("API Keys của Gemini chưa được cấu hình. Vui lòng thêm vào application.yaml.");
        }

        int maxRetries = Math.max(keys.size() * 3, 12);
        int backoff503 = 2000; // Khởi tạo exponential backoff cho 503 (2s)
        int backoff429 = 1000; // Khởi tạo backoff ngắn cho 429 (1s)
        int error503Count = 0;
        Set<Integer> exhaustedKeyIndexes = new HashSet<>();

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", prompt);

        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", List.of(parts));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");

        requestBody.put("contents", List.of(contents));
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        for (int i = 0; i < maxRetries; i++) {
            if (exhaustedKeyIndexes.size() >= keys.size()) {
                break;
            }
            int index = currentKeyIndex.getAndUpdate(idx -> (idx + 1) % keys.size());
            if (exhaustedKeyIndexes.contains(index)) {
                continue;
            }
            String apiKey = keys.get(index);
            String requestUrl = targetUrl + "?key=" + apiKey;

            try {
                // Send POST request
                String jsonResponse = restTemplate.postForObject(requestUrl, entity, String.class);
                
                // Parse the JSON response
                JsonNode rootNode = objectMapper.readTree(jsonResponse);
                JsonNode textNode = rootNode.path("candidates")
                                            .get(0)
                                            .path("content")
                                            .path("parts")
                                            .get(0)
                                            .path("text");
                
                if (textNode.isMissingNode()) {
                    throw new BusinessException("Không tìm thấy kết quả hợp lệ từ Gemini.");
                }
                
                return textNode.asText();
            } catch (HttpStatusCodeException httpException) {
                int statusCode = httpException.getStatusCode().value();
                String errorBody = httpException.getResponseBodyAsString().toLowerCase();
                log.error("Gemini API HTTP Error {}: {}", statusCode, errorBody);
                
                if (statusCode == 401) {
                    // 401 có thể do key invalid HOẶC do RPM quota bị exceeded (một số Gemini region trả 401 thay vì 429)
                    // Check body để phân biệt
                    if (errorBody.contains("quota") || errorBody.contains("exhausted") || errorBody.contains("billing")) {
                        exhaustedKeyIndexes.add(index);
                        log.warn("Gemini API Key ending in {} exhausted quota. Skipping this key.", apiKey.substring(Math.max(0, apiKey.length() - 4)));
                    } else if (errorBody.contains("rate") || errorBody.contains("limit")) {
                        log.warn("Gemini API Key kết thúc bằng {} bị 401 do Rate Limit/Quota. Nghỉ {}ms rồi thử tiếp...", apiKey.substring(Math.max(0, apiKey.length() - 4)), backoff429);
                        try { Thread.sleep(backoff429); } catch (InterruptedException ignored) {}
                        backoff429 = Math.min(backoff429 * 2, 8000);
                    } else {
                        exhaustedKeyIndexes.add(index);
                        log.warn("Gemini API Key kết thúc bằng {} bị lỗi 401 (Key Invalid). Bỏ qua key này...", apiKey.substring(Math.max(0, apiKey.length() - 4)));
                    }
                } else if (statusCode == 429) {
                    if (errorBody.contains("quota") || errorBody.contains("exhausted") || errorBody.contains("billing")) {
                        exhaustedKeyIndexes.add(index);
                        log.warn("Gemini API Key kết thúc bằng {} đã hết Quota ngày (RPD). Bỏ qua...", apiKey.substring(Math.max(0, apiKey.length() - 4)));
                    } else {
                        log.warn("Gemini API bị Rate Limit (RPM). Nghỉ ngơi {}ms rồi thử tiếp...", backoff429);
                        try { Thread.sleep(backoff429); } catch (InterruptedException ignored) {}
                        backoff429 = Math.min(backoff429 * 2, 8000); // Backoff ngắn cho 429
                    }
                } else if (statusCode == 404) {
                    throw new BusinessException("Gemini Model not found or API Key lacks access (404 Not Found).");
                } else if (statusCode == 400) {
                    throw new BusinessException("Bad Request payload sent to Gemini (400 Bad Request).");
                } else if (statusCode == 503 || statusCode == 500) {
                    error503Count++;
                    log.warn("Gemini API {} Error (Overloaded). Exponential Backoff: đợi {}ms...", statusCode, backoff503);
                    if (error503Count >= 3) {
                        throw new BusinessException("Gemini API is currently overloaded (" + statusCode + "). Failing fast to fallback.");
                    }
                    if (i == maxRetries - 1) {
                        throw new BusinessException("Gemini API is currently overloaded (" + statusCode + "). Please try again in a few minutes.");
                    }
                    try { Thread.sleep(backoff503); } catch (InterruptedException ignored) {}
                    backoff503 = Math.min(backoff503 * 2, 8000); // Giảm tối đa xuống 8s để không treo lâu
                } else {
                    throw new BusinessException("Lỗi kết nối Gemini API: " + statusCode);
                }
            } catch (Exception ex) {
                if (ex instanceof BusinessException) {
                    throw (BusinessException) ex;
                }
                log.error("Gemini API Exception: ", ex);
                throw new BusinessException("Lỗi xử lý kết quả từ Gemini API: " + ex.getMessage());
            }
        }
        
        throw new BusinessException("Không thể gọi Gemini API với các keys hiện có.");
    }
    private String normalizeTargetUrl(String configuredUrl) {
        if (configuredUrl == null || configuredUrl.isBlank()) {
            return DEFAULT_GENERATE_CONTENT_URL;
        }

        String targetUrl = configuredUrl.trim();
        if (targetUrl.contains("/models/gemini-2.5-flash:")) {
            log.warn("Configured Gemini model gemini-2.5-flash is unavailable for this API key. Using gemini-3.6-flash instead.");
            return targetUrl.replace("/models/gemini-2.5-flash:", "/models/gemini-3.6-flash:");
        }
        return targetUrl;
    }
}
