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

    public String generateComment(String memberName, int totalAssigned, int completedCount, int completedOnTime,
                                   int overdueCount, int penalizedCount, double totalWeight,
                                   double totalEstimatedHours, double avgDaysEarly, int highPriorityCount) {
        if (apiKey == null || apiKey.isBlank() || endpoint == null || endpoint.isBlank()) {
            return null;
        }

        try {
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
