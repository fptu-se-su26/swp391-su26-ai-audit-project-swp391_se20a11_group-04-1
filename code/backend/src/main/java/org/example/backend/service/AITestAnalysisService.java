package org.example.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AITestAnalysisService {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public AITestAnalysisService() {
        this.restTemplate = new RestTemplate();
    }

    public String analyzeTestError(String testTitle, String expectedResult, String errorMessage, Integer failedStepIndex) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("AIzaSyBKICtKaj8C5Bz2L4TTKuTL6uIVYibFk7k")) {
             // We can let it pass even with this key since it might be a real key the user provided.
             // But actually let's check for basic emptiness or placeholder.
        }
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "Tính năng phân tích lỗi bằng AI chưa được cấu hình API Key. Vui lòng thêm GEMINI_API_KEY vào cấu hình (application.yaml).";
        }

        String prompt = String.format("""
            Bạn là QA engineer chuyên nghiệp. Hãy phân tích lỗi test sau bằng tiếng Việt.
            
            Test case: %s
            Kết quả mong đợi: %s
            Bước bị lỗi: bước số %s
            
            Error message (từ Playwright):
            %s
            
            Hãy giải thích:
            1. Lỗi này có nghĩa là gì (ngắn gọn, dễ hiểu)
            2. Nguyên nhân có thể (tối đa 3 gợi ý)
            3. Cách kiểm tra/fix (cụ thể, thực tế)
            
            Trả lời bằng tiếng việt, định dạng markdown rõ ràng ngắn gọn, không quá 200 từ.
            """,
            testTitle, 
            expectedResult != null ? expectedResult : "Không có", 
            failedStepIndex != null ? (failedStepIndex + 1) : "không xác định",
            errorMessage
        );

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);

            Map<String, Object> parts = new HashMap<>();
            parts.put("parts", List.of(textPart));

            Map<String, Object> body = new HashMap<>();
            body.put("contents", List.of(parts));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            String url = apiUrl + "?key=" + apiKey;

            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    if (content != null) {
                        List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
                        if (resParts != null && !resParts.isEmpty()) {
                            return (String) resParts.get(0).get("text");
                        }
                    }
                }
            }
            return "Không thể lấy kết quả phân tích từ AI.";
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            int statusCode = e.getStatusCode().value();
            if (statusCode == 429) {
                return "Tính năng phân tích AI tạm thời không khả dụng do vượt quá giới hạn quota. Vui lòng thử lại sau vài phút.";
            }
            if (statusCode == 401 || statusCode == 403) {
                return "API Key Gemini không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại cấu hình.";
            }
            if (statusCode == 404) {
                return "Model AI không tìm thấy. Vui lòng liên hệ quản trị viên.";
            }
            return "Lỗi khi gọi AI (" + statusCode + "): " + e.getStatusText();
        } catch (Exception e) {
            return "Đã xảy ra lỗi khi gọi AI: " + e.getMessage();
        }
    }
}
