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

    public String generateNarrative(String sprintName, String projectName, String sprintGoal,
            int totalTasks, int completedTasks, int completedOnTime, int overdueTasks, int penalizedTasks,
            int totalMembers, int redMembers,
            java.util.List<org.example.backend.entity.SprintMemberSummary> memberSummaries) {
        if (apiKey == null || apiKey.isBlank() || endpoint == null || endpoint.isBlank()) {
            return null;
        }

        try {
            double completionRate = totalTasks == 0 ? 0.0 : ((double) completedTasks / totalTasks) * 100.0;
            String goalText = (sprintGoal != null && !sprintGoal.isBlank()) ? sprintGoal : "(no sprint goal set)";

            StringBuilder memberData = new StringBuilder();
            for (org.example.backend.entity.SprintMemberSummary m : memberSummaries) {
                memberData.append(String.format("  - %s: %d tasks assigned, %d on-time, %d overdue, %d penalized → %s%n",
                        m.name(), m.totalAssigned(), m.completedOnTime(), m.overdueCount(), m.penalizedCount(), m.riskLevel()));
            }

            String prompt = String.format("""
                    You are a Scrum Master giving feedback at Sprint Retrospective. Write in Vietnamese, max 80 words, ONE paragraph.

                    Rules:
                    - NEVER use "có thể", "có vẻ", "dường như", "có thể là". Make direct statements only.
                    - Compare members directly: if one member has 100%% overdue while others have 0%%, state that contrast as a fact.
                    - Name the struggling member explicitly and name who can help them.
                    - Draw conclusion from the contrast between members — that IS the data.
                    - Do NOT echo numbers. Say what the pattern means.
                    - End with one concrete action using real names.

                    Sprint: %s | Project: %s | Goal: %s
                    Overall: %d/%d tasks done (%.0f%%), %d overdue, %d penalized

                    Per-member breakdown:
                    %s
                    """,
                    sprintName, projectName, goalText,
                    completedTasks, totalTasks, completionRate, overdueTasks, penalizedTasks,
                    memberData.toString()
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

    public String generateCriteriaJson(String sprintName, String projectName, String sprintGoal,
            int totalTasks, int completedTasks, int completedOnTime, int overdueTasks,
            int penalizedTasks, int totalMembers, int redMembers) {
        if (apiKey == null || apiKey.isBlank() || endpoint == null || endpoint.isBlank()) {
            return null;
        }
        try {
            double completionRate = totalTasks == 0 ? 0.0 : ((double) completedTasks / totalTasks) * 100.0;
            double onTimeRate = totalTasks == 0 ? 0.0 : ((double) completedOnTime / totalTasks) * 100.0;
            String goalText = (sprintGoal != null && !sprintGoal.isBlank()) ? sprintGoal : "(Không có mục tiêu sprint)";

            String prompt = String.format("""
                    Bạn là Project Coach Agile. Hãy đánh giá sprint và trả về KẾT QUẢ DUY NHẤT là một JSON object hợp lệ (không có markdown, không có ```json, không có text ngoài JSON).
                    JSON phải có đúng 6 key sau, mỗi value là chuỗi tiếng Việt 2-4 câu ngắn gọn, súc tích:
                    {
                      "sprintGoal": "...",
                      "delivery": "...",
                      "quality": "...",
                      "teamPerformance": "...",
                      "process": "...",
                      "improvement": "..."
                    }

                    Dữ liệu sprint:
                    - Sprint: %s | Project: %s
                    - Mục tiêu: %s
                    - Tổng task: %d | Hoàn thành: %d (%.1f%%)
                    - Đúng hạn: %d (%.1f%%) | Trễ hạn: %d | Penalty: %d
                    - %d/%d thành viên gặp vấn đề rủi ro.
                    """,
                    sprintName, projectName, goalText,
                    totalTasks, completedTasks, completionRate,
                    completedOnTime, onTimeRate, overdueTasks, penalizedTasks,
                    redMembers, totalMembers
            );

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
            );
            String separator = endpoint.contains("?") ? "&" : "?";
            Map<?, ?> response = restTemplate.postForObject(
                    endpoint + separator + "key=" + apiKey, requestBody, Map.class);

            String text = extractText(response);
            if (text == null || text.isBlank()) return null;
            text = text.trim();
            // Loại bỏ markdown code fence nếu Gemini vẫn thêm vào
            if (text.startsWith("```")) {
                text = text.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
            }
            // Validate là JSON hợp lệ
            objectMapper.readTree(text);
            return text;
        } catch (Exception ex) {
            log.warn("GeminiSprintNarrativeService criteria JSON generation failed: {}", ex.getMessage());
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
