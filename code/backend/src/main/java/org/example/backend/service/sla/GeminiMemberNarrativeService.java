package org.example.backend.service.sla;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiMemberNarrativeService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:}")
    private String endpoint;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String generateComment(String memberName, int totalAssigned, int completedOnTime, int overdueCount, int penalizedCount) {
        if (apiKey == null || apiKey.isBlank() || endpoint == null || endpoint.isBlank()) {
            return null;
        }

        try {
            double onTimeRate = totalAssigned == 0 ? 0.0 : ((double) completedOnTime / totalAssigned) * 100.0;
            
            String prompt = String.format("""
                    Bạn là Project Coach trong hệ thống quản lý dự án học thuật.
                    Viết 1-2 câu nhận xét cá nhân cho thành viên dưới đây.
                    Giọng văn: thân thiện, cụ thể, mang tính khuyến khích nếu làm tốt,
                    hoặc đưa ra 1 gợi ý hành động cụ thể nếu chưa tốt. Không phán xét.
                    Không dùng tên thành viên trong câu (tránh cứng nhắc).

                    Dữ liệu:
                    - Task được giao: %d
                    - Hoàn thành đúng hạn: %d
                    - Trễ hạn: %d
                    - Bị penalty: %d
                    - Tỷ lệ đúng hạn: %.1f%%

                    Trả về 1-2 câu tiếng Việt, văn xuôi thuần túy, không markdown, không JSON.
                    """,
                    totalAssigned,
                    completedOnTime,
                    overdueCount,
                    penalizedCount,
                    onTimeRate
            );

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", prompt))
                    ))
            );

            String separator = endpoint.contains("?") ? "&" : "?";
            Map<?, ?> response = restTemplate.postForObject(
                    endpoint + separator + "key=" + apiKey,
                    requestBody,
                    Map.class
            );

            String text = extractText(response);
            if (text == null || text.isBlank()) return null;
            return text.trim();

        } catch (Exception ex) {
            log.warn("GeminiMemberNarrativeService narrative generation failed: {}", ex.getMessage());
            return null;
        }
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
