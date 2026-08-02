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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiRecoveryService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:}")
    private String endpoint;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiRecoveryResult generateContent(GeminiRecoveryContext context) {
        if (apiKey == null || apiKey.isBlank() || endpoint == null || endpoint.isBlank()) {
            return null;
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", buildPrompt(context)))
                    ))
            );

            String separator = endpoint.contains("?") ? "&" : "?";
            Map<?, ?> response = restTemplate.postForObject(
                    endpoint + separator + "key=" + apiKey,
                    requestBody,
                    Map.class
            );

            String rawText = extractText(response);
            if (rawText == null || rawText.isBlank()) {
                return null;
            }
            return objectMapper.readValue(stripJsonFence(rawText), GeminiRecoveryResult.class);
        } catch (Exception ex) {
            log.warn("Gemini recovery content generation failed, using fallback text: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Legacy direct-Gemini path kept for compatibility.
     * Current Recovery Plan generation flows through MlServiceClient -> FastAPI ML service,
     * where RAG context and Ollama/Gemini provider selection are handled centrally.
     */
    public GeminiRecoveryResult generateWithRagContext(
            GeminiRecoveryContext context,
            List<Map<String, Object>> similarPlans) {

        if (apiKey == null || apiKey.isBlank() || endpoint == null || endpoint.isBlank()) {
            return null;
        }
        try {
            String prompt = buildPrompt(context) + buildRagSection(similarPlans);
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
            String rawText = extractText(response);
            if (rawText == null || rawText.isBlank()) return null;
            return objectMapper.readValue(stripJsonFence(rawText), GeminiRecoveryResult.class);
        } catch (Exception ex) {
            log.warn("Gemini RAG generation failed, falling back to base Gemini: {}", ex.getMessage());
            return generateContent(context);
        }
    }

    private String buildRagSection(List<Map<String, Object>> plans) {
        if (plans == null || plans.isEmpty()) return "";
        StringBuilder sb = new StringBuilder(
                "\n\nKinh nghiệm từ các recovery plan đã thành công trước đây:\n");
        int i = 1;
        for (Map<String, Object> p : plans) {
            String cats = formatList(p.get("categories"));
            String acts = formatList(p.get("actions"));
            sb.append(String.format(
                    "[Plan %d] Risk: %s | Vấn đề: %s | Hành động: %s | Score: %s -> %s (+%s)\n",
                    i++,
                    p.getOrDefault("risk_level", "?"),
                    cats, acts,
                    p.getOrDefault("score_before", "?"),
                    p.getOrDefault("score_after", "?"),
                    p.getOrDefault("improvement", "?")));
        }
        sb.append("Dựa trên các kinh nghiệm trên, hãy sinh recovery plan phù hợp nhất.\n");
        return sb.toString();
    }

    private String formatList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).collect(Collectors.joining(", "));
        }
        return value != null ? value.toString() : "";
    }

    private String buildPrompt(GeminiRecoveryContext context) {
        return String.format("""
                You are an Agile Coach inside a student software project management system.
                Write very short Vietnamese recovery-plan content for a task with SLA risk.
                Tone: clear, practical, easy to execute. Do not compute SLA score.
                Use only the provided backend context. Avoid technical labels unless needed.

                Task context:
                - Task title: %s
                - Risk level: %s
                - Current SLA score: %s
                - SLA categories: %s
                - Overdue days: %d
                - Assignee active task count: %d
                - Reasons: %s
                - Is follow-up after failed plan: %s
                - Previous plan count for this task: %d
                - Previous actions: %s
                - Previous effectiveness: %s
                - Last score before/after execution: %s -> %s
                - Member candidates: %s

                Choose 1 to 4 actions from this exact whitelist only:
                [NOTIFY_ASSIGNEE, ESCALATE_LEADER, ASK_BLOCKER_UPDATE,
                 CREATE_RECOVERY_CHECKLIST, SCHEDULE_FOLLOW_UP, SUGGEST_SPLIT_TASK, SUGGEST_REASSIGN]

                Decision guidance:
                - If a previous notify-only plan failed, prefer escalation/checklist/reassign instead of repeating notify only.
                - If assignee active task count is high, consider SUGGEST_REASSIGN or SUGGEST_SPLIT_TASK.
                - For SUGGEST_REASSIGN, pick only from Member candidates.
                - If blocked, include ASK_BLOCKER_UPDATE.
                - Keep important project changes under human approval; only propose actions.

                Writing rules:
                - summary: one sentence, max 18 Vietnamese words.
                - selectedActions: 1 to 3 actions only.
                - action message: one sentence, max 16 Vietnamese words.
                - checklistItems: only for CREATE_RECOVERY_CHECKLIST, max 3 items, max 10 Vietnamese words each.
                - For SUGGEST_REASSIGN only: fill recommendedAssigneeId, recommendedAssigneeName, recommendedReason, notRecommendedAssignees.
                - recommendedReason: max 10 Vietnamese words.
                - notRecommendedAssignees: max 3 short Vietnamese strings like "Tên: lý do".
                - No verification, confidence, success/fallback, rationale, long explanation.

                Return plain JSON only, no markdown:
                {
                  "summary": "...",
                  "selectedActions": [
                    {
                      "actionType": "ESCALATE_LEADER",
                      "priority": "HIGH",
                      "message": "...",
                      "checklistItems": ["..."],
                      "recommendedAssigneeId": 1,
                      "recommendedAssigneeName": "...",
                      "recommendedReason": "...",
                      "notRecommendedAssignees": ["..."]
                    }
                  ]
                }
                """,
                safe(context.getTaskTitle()),
                safe(context.getRiskLevel()),
                context.getSlaScore() == null ? "unknown" : context.getSlaScore().toString(),
                String.join(", ", nullToEmpty(context.getCategories())),
                context.getOverdueDays(),
                context.getAssigneeActiveTaskCount(),
                String.join("; ", nullToEmpty(context.getReasons())),
                context.isFollowUp(),
                context.getPreviousPlanCount(),
                String.join(", ", nullToEmpty(context.getPreviousActions())),
                safe(context.getPreviousEffectiveness()),
                context.getLastScoreBefore() == null ? "unknown" : context.getLastScoreBefore().toString(),
                context.getLastScoreAfter() == null ? "unknown" : context.getLastScoreAfter().toString(),
                formatMemberCandidates(context.getMemberCandidates())
        );
    }

    private String formatMemberCandidates(List<AiRecoveryMemberCandidate> candidates) {
        if (candidates == null || candidates.isEmpty()) {
            return "none";
        }
        return candidates.stream()
                .limit(6)
                .map(candidate -> String.format(
                        "id=%s, name=%s, role=%s, activeTasks=%d, overdueTasks=%d, currentOwner=%s",
                        candidate.getUserId(),
                        safe(candidate.getDisplayName()),
                        safe(candidate.getRoleName()),
                        candidate.getActiveTaskCount(),
                        candidate.getOverdueTaskCount(),
                        candidate.isCurrentAssignee()))
                .collect(Collectors.joining(" | "));
    }

    private String extractText(Map<?, ?> response) {
        try {
            JsonNode root = objectMapper.valueToTree(response);
            return root.path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text").asText(null);
        } catch (Exception ex) {
            log.warn("Failed to extract Gemini recovery text: {}", ex.getMessage());
            return null;
        }
    }

    private String stripJsonFence(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7).trim();
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3).trim();
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3).trim();
        }
        return cleaned;
    }

    private List<String> nullToEmpty(List<String> value) {
        return value == null ? List.of() : value;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
