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
public class GeminiReliabilityService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:}")
    private String endpoint;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String generateNarrative(
            Long projectId,
            Long sprintId,
            SlaReliabilityMetricsService.MttrResult mttr,
            SlaReliabilityMetricsService.AvailabilityResult avail,
            SlaReliabilityMetricsService.ErrorBudgetResult budget,
            int healthyThreshold) {

        if (apiKey == null || apiKey.isBlank() || endpoint == null || endpoint.isBlank()) {
            return null;
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", buildPrompt(mttr, avail, budget, healthyThreshold)))
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
            log.warn("GeminiReliabilityService narrative generation failed: {}", ex.getMessage());
            return null;
        }
    }

    private String buildPrompt(
            SlaReliabilityMetricsService.MttrResult mttr,
            SlaReliabilityMetricsService.AvailabilityResult avail,
            SlaReliabilityMetricsService.ErrorBudgetResult budget,
            int healthyThreshold) {

        String mttrStr = mttr.mttrHours() != null
                ? mttr.mttrHours() + " giờ (" + mttr.sampleCount() + " chu kỳ phục hồi)"
                : "chưa có dữ liệu (chưa có chu kỳ phục hồi hoàn chỉnh)";

        String availStr = avail.availabilityPct() != null
                ? avail.availabilityPct() + "% (" + avail.healthyIntervals() + "/" + avail.totalIntervals()
                  + " lần evaluation score ≥ " + healthyThreshold + ")"
                : "chưa có dữ liệu";

        return String.format("""
                Bạn là một SRE Coach trong hệ thống quản lý dự án học thuật.
                Viết 2-3 câu tiếng Việt tóm tắt tình trạng reliability của team trong sprint này.
                Giọng văn: khách quan, mang tính xây dựng, không phán xét.
                Chỉ dùng dữ liệu được cung cấp, không suy diễn thêm.

                Dữ liệu reliability:
                - MTTR (thời gian phục hồi trung bình): %s
                - Availability: %s
                - Error Budget: đã tiêu %.1f%% trên tổng ngân sách được phép (%d/%d task bị penalty)

                Trả về văn xuôi thuần túy, không dùng markdown, không dùng JSON.
                """,
                mttrStr,
                availStr,
                budget.consumedPct() != null ? budget.consumedPct().doubleValue() : 0.0,
                budget.penalizedTasks(),
                budget.totalTasks()
        );
    }

    private String extractText(Map<?, ?> response) {
        try {
            JsonNode root = objectMapper.valueToTree(response);
            return root.path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text").asText(null);
        } catch (Exception ex) {
            log.warn("Failed to extract Gemini reliability text: {}", ex.getMessage());
            return null;
        }
    }
}
