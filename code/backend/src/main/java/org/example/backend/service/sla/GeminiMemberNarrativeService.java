package org.example.backend.service.sla;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.GeminiProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiMemberNarrativeService {

    private static final String DEFAULT_GENERATE_CONTENT_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiProperties geminiProperties;

    public String generateComment(String memberName, int totalAssigned, int completedCount, int completedOnTime,
                                   int overdueCount, int penalizedCount, double totalWeight,
                                   double totalEstimatedHours, double avgDaysEarly, int highPriorityCount) {

        String targetUrl = normalizeTargetUrl(geminiProperties.getUrl());
        List<String> keys = geminiProperties.getKeys();

        if (keys == null || keys.isEmpty() || targetUrl == null || targetUrl.isBlank()) {
            log.warn("Gemini API keys or URL not configured for member narrative.");
            return null;
        }

        double onTimeRate = totalAssigned == 0 ? 0.0 : ((double) completedOnTime / totalAssigned) * 100.0;
        String earlyLate = avgDaysEarly >= 0
                ? String.format("sớm hơn %.1f ngày", avgDaysEarly)
                : String.format("trễ %.1f ngày", -avgDaysEarly);

        String prompt = String.format("""
                Viết đánh giá sprint cho thành viên tên chính xác là: "%s" (KHÔNG được đổi tên, sửa dấu, hay viết tắt).

                Dữ liệu:
                - Hoàn thành đúng hạn: %d/%d (%.0f%%)
                - Trễ hạn: %d | Penalty: %d
                - Tổng task xong: %d | Trọng số công việc: %.1f | Giờ ước tính: %.1fh
                - Nộp %s | Task HIGH/CRITICAL: %d

                Yêu cầu:
                - Đúng 2 câu tiếng Việt, tối đa 35 từ.
                - Câu 1: nêu thẳng vấn đề nổi bật nhất (điểm mạnh hoặc điểm yếu), dùng tên "%s".
                - Câu 2: hành động cụ thể cho sprint sau.
                - KHÔNG dùng: "nhìn chung", "có thể", "đây là", "cần cải thiện giao tiếp", hay bất kỳ cụm từ chung chung.
                - KHÔNG lặp lại số liệu, hãy diễn giải ý nghĩa.
                """,
                memberName,
                completedOnTime, totalAssigned, onTimeRate,
                overdueCount, penalizedCount,
                completedCount, totalWeight, totalEstimatedHours,
                earlyLate, highPriorityCount,
                memberName
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                ))
        );

        for (String apiKey : keys) {
            if (apiKey == null || apiKey.isBlank() || "disabled".equalsIgnoreCase(apiKey.trim()) || "replace_me".equalsIgnoreCase(apiKey.trim())) {
                continue;
            }
            try {
                String separator = targetUrl.contains("?") ? "&" : "?";
                String requestUrl = targetUrl + separator + "key=" + apiKey.trim();

                Map<?, ?> response = restTemplate.postForObject(requestUrl, requestBody, Map.class);
                String text = extractText(response);
                if (text != null && !text.isBlank()) {
                    return text.trim();
                }
            } catch (HttpStatusCodeException httpEx) {
                log.warn("GeminiMemberNarrativeService comment failed with key ending in {} [HTTP {}]: {}",
                        apiKey.substring(Math.max(0, apiKey.length() - 4)),
                        httpEx.getStatusCode(), httpEx.getResponseBodyAsString());
            } catch (Exception ex) {
                log.warn("GeminiMemberNarrativeService comment attempt failed with key ending in {}: {}",
                        apiKey.substring(Math.max(0, apiKey.length() - 4)), ex.getMessage());
            }
        }

        log.warn("All Gemini API keys failed for GeminiMemberNarrativeService comment.");
        return null;
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

    private String extractText(Map<?, ?> response) {
        try {
            JsonNode root = objectMapper.valueToTree(response);
            return root.path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text").asText(null);
        } catch (Exception ex) {
            log.warn("Failed to extract Gemini member text: {}", ex.getMessage());
            return null;
        }
    }
}

