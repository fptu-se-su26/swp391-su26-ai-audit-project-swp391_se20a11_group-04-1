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
public class GeminiSprintNarrativeService {

    private static final String DEFAULT_GENERATE_CONTENT_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiProperties geminiProperties;

    public String generateNarrative(String sprintName, String projectName, String sprintGoal,
            int totalTasks, int completedTasks, int completedOnTime, int overdueTasks, int penalizedTasks,
            int totalMembers, int redMembers,
            java.util.List<org.example.backend.entity.SprintMemberSummary> memberSummaries) {
        return generateNarrative(sprintName, projectName, sprintGoal, totalTasks, completedTasks, completedOnTime,
                overdueTasks, penalizedTasks, totalMembers, redMembers, memberSummaries, List.of());
    }

    public String generateNarrative(String sprintName, String projectName, String sprintGoal,
            int totalTasks, int completedTasks, int completedOnTime, int overdueTasks, int penalizedTasks,
            int totalMembers, int redMembers,
            java.util.List<org.example.backend.entity.SprintMemberSummary> memberSummaries,
            List<String> riskyTaskDetails) {

        String targetUrl = normalizeTargetUrl(geminiProperties.getUrl());
        List<String> keys = geminiProperties.getKeys();

        if (keys == null || keys.isEmpty() || targetUrl == null || targetUrl.isBlank()) {
            log.warn("Gemini API keys or URL not configured for sprint narrative.");
            return null;
        }

        double completionRate = totalTasks == 0 ? 0.0 : ((double) completedTasks / totalTasks) * 100.0;
        String goalText = (sprintGoal != null && !sprintGoal.isBlank()) ? sprintGoal : "(no sprint goal set)";

        StringBuilder memberData = new StringBuilder();
        for (org.example.backend.entity.SprintMemberSummary m : memberSummaries) {
            memberData.append(String.format("  - %s: %d tasks assigned, %d on-time, %d overdue, %d penalized → %s%n",
                    m.name(), m.totalAssigned(), m.completedOnTime(), m.overdueCount(), m.penalizedCount(), m.riskLevel()));
        }

        StringBuilder taskData = new StringBuilder();
        if (riskyTaskDetails != null && !riskyTaskDetails.isEmpty()) {
            taskData.append("\nRisky/Overdue Task details:\n");
            for (String td : riskyTaskDetails) {
                taskData.append("  - ").append(td).append("\n");
            }
        }

        String prompt = String.format("""
                You are a Scrum Master giving feedback at Sprint Retrospective. Write in Vietnamese, max 90 words, ONE paragraph, plain text only.

                Rules:
                - Do NOT use Markdown, bullets, headings, asterisks, or quotes for emphasis.
                - NEVER use "có thể", "có vẻ", "dường như", "có thể là". Make direct statements only.
                - Compare members directly: if one member has 100%% overdue while others have 0%%, state that contrast as a fact.
                - Name struggling members explicitly and connect with specific tasks if provided.
                - Draw conclusions from real patterns in the sprint data.
                - Do NOT echo raw metrics numbers repeatedly. Explain what they mean for the team.
                - End with one concrete action using real member names.

                Sprint: %s | Project: %s | Goal: %s
                Overall: %d/%d tasks done (%.0f%%), %d overdue, %d penalized

                Per-member breakdown:
                %s%s
                """,
                sprintName, projectName, goalText,
                completedTasks, totalTasks, completionRate, overdueTasks, penalizedTasks,
                memberData.toString(),
                taskData.toString()
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
                    return stripMarkdownEmphasis(text).trim();
                }
            } catch (HttpStatusCodeException httpEx) {
                log.warn("GeminiSprintNarrativeService failed with key ending in {} [HTTP {}]: {}",
                        apiKey.substring(Math.max(0, apiKey.length() - 4)),
                        httpEx.getStatusCode(), httpEx.getResponseBodyAsString());
            } catch (Exception ex) {
                log.warn("GeminiSprintNarrativeService attempt failed with key ending in {}: {}",
                        apiKey.substring(Math.max(0, apiKey.length() - 4)), ex.getMessage());
            }
        }

        log.warn("All Gemini API keys failed for GeminiSprintNarrativeService narrative.");
        return null;
    }

    public String generateCriteriaJson(String sprintName, String projectName, String sprintGoal,
            int totalTasks, int completedTasks, int completedOnTime, int overdueTasks,
            int penalizedTasks, int totalMembers, int redMembers) {

        String targetUrl = normalizeTargetUrl(geminiProperties.getUrl());
        List<String> keys = geminiProperties.getKeys();

        if (keys == null || keys.isEmpty() || targetUrl == null || targetUrl.isBlank()) {
            log.warn("Gemini API keys or URL not configured for criteria JSON.");
            return null;
        }

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
                    text = text.trim();
                    if (text.startsWith("```")) {
                        text = text.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
                    }
                    objectMapper.readTree(text);
                    return text;
                }
            } catch (HttpStatusCodeException httpEx) {
                log.warn("GeminiSprintNarrativeService criteria failed with key ending in {} [HTTP {}]: {}",
                        apiKey.substring(Math.max(0, apiKey.length() - 4)),
                        httpEx.getStatusCode(), httpEx.getResponseBodyAsString());
            } catch (Exception ex) {
                log.warn("GeminiSprintNarrativeService criteria attempt failed with key ending in {}: {}",
                        apiKey.substring(Math.max(0, apiKey.length() - 4)), ex.getMessage());
            }
        }

        log.warn("All Gemini API keys failed for GeminiSprintNarrativeService criteria JSON.");
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
            log.warn("Failed to extract Gemini sprint narrative text: {}", ex.getMessage());
            return null;
        }
    }

    private String stripMarkdownEmphasis(String value) {
        if (value == null) return null;
        return value
                .replaceAll("\\*\\*\\*(.*?)\\*\\*\\*", "$1")
                .replaceAll("\\*\\*(.*?)\\*\\*", "$1")
                .replaceAll("\\*(.*?)\\*", "$1")
                .replaceAll("\\s+", " ");
    }
}
