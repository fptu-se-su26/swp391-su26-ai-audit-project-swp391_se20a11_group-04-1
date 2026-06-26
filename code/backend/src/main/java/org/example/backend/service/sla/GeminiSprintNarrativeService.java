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
public class GeminiSprintNarrativeService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:}")
    private String endpoint;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String generateNarrative(String sprintName, String projectName, int totalTasks, int completedTasks, int completedOnTime, int overdueTasks, int penalizedTasks, int totalMembers, int redMembers) {
        if (apiKey == null || apiKey.isBlank() || endpoint == null || endpoint.isBlank()) {
            return null;
        }

        try {
            double completionRate = totalTasks == 0 ? 0.0 : ((double) completedTasks / totalTasks) * 100.0;
            double onTimeRate = totalTasks == 0 ? 0.0 : ((double) completedOnTime / totalTasks) * 100.0;

            String prompt = String.format("""
                    Bạn là Project Coach chuyên nghiệp trong mô hình Agile.
                    Dựa vào các thông số sau, hãy đánh giá Sprint một cách xây dựng và chuyên nghiệp (không phán xét cá nhân).
                    Viết báo cáo đánh giá dưới dạng Markdown, BẮT BUỘC có 6 phần (tiêu đề in đậm bằng ###):
                    ### 1. Sprint Goal
                    ### 2. Delivery
                    ### 3. Quality
                    ### 4. Team Performance
                    ### 5. Process
                    ### 6. Improvement

                    Nếu thông số không đủ để kết luận chính xác một tiêu chí (như Quality hay Process), hãy đưa ra lời khuyên Agile tiêu chuẩn dựa trên số task trễ hạn/bị phạt.
                    Chỉ trả về nội dung Markdown thuần túy, không thêm câu chào hỏi thừa.

                    Dữ liệu thực tế của Sprint:
                    - Sprint: %s | Project: %s
                    - Tổng task: %d | Hoàn thành: %d (%.1f%%)
                    - Đúng hạn: %d (%.1f%%) | Trễ hạn: %d | Bị phạt (Penalty): %d
                    - Có %d thành viên gặp vấn đề/rủi ro trên tổng số %d thành viên.
                    """,
                    sprintName,
                    projectName,
                    totalTasks,
                    completedTasks,
                    completionRate,
                    completedOnTime,
                    onTimeRate,
                    overdueTasks,
                    penalizedTasks,
                    redMembers,
                    totalMembers
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
            log.warn("GeminiSprintNarrativeService narrative generation failed: {}", ex.getMessage());
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
            log.warn("Failed to extract Gemini sprint narrative text: {}", ex.getMessage());
            return null;
        }
    }
}
