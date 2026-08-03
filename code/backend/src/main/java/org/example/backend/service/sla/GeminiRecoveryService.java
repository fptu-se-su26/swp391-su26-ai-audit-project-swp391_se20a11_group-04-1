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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiRecoveryService {

    private static final String DEFAULT_GENERATE_CONTENT_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiProperties geminiProperties;

    public GeminiRecoveryResult generateContent(GeminiRecoveryContext context) {
        String targetUrl = normalizeTargetUrl(geminiProperties.getUrl());
        List<String> keys = geminiProperties.getKeys();

        if (keys == null || keys.isEmpty() || targetUrl == null || targetUrl.isBlank()) {
            log.warn("Gemini API keys or URL not configured.");
            return null;
        }

        String prompt = buildPrompt(context);

        for (String apiKey : keys) {
            if (apiKey == null || apiKey.isBlank() || "disabled".equalsIgnoreCase(apiKey.trim()) || "replace_me".equalsIgnoreCase(apiKey.trim())) {
                continue;
            }

            try {
                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(Map.of(
                                "parts", List.of(Map.of("text", prompt))
                        ))
                );

                String separator = targetUrl.contains("?") ? "&" : "?";
                String requestUrl = targetUrl + separator + "key=" + apiKey.trim();

                Map<?, ?> response = restTemplate.postForObject(
                        requestUrl,
                        requestBody,
                        Map.class
                );

                String rawText = extractText(response);
                if (rawText != null && !rawText.isBlank()) {
                    return objectMapper.readValue(stripJsonFence(rawText), GeminiRecoveryResult.class);
                }
            } catch (HttpStatusCodeException httpEx) {
                log.warn("Gemini recovery generation failed with key ending in {} [HTTP {}]: {}",
                        apiKey.substring(Math.max(0, apiKey.length() - 4)),
                        httpEx.getStatusCode(), httpEx.getResponseBodyAsString());
            } catch (Exception ex) {
                log.warn("Gemini recovery generation attempt failed with key ending in {}: {}",
                        apiKey.substring(Math.max(0, apiKey.length() - 4)), ex.getMessage());
            }
        }

        log.warn("All Gemini API keys failed for recovery content generation.");
        return null;
    }

    /**
     * Legacy direct-Gemini path kept for compatibility.
     * Current Recovery Plan generation flows through MlServiceClient -> FastAPI ML service,
     * where RAG context and Ollama/Gemini provider selection are handled centrally.
     */
    public GeminiRecoveryResult generateWithRagContext(
            GeminiRecoveryContext context,
            List<Map<String, Object>> similarPlans) {

        String targetUrl = normalizeTargetUrl(geminiProperties.getUrl());
        List<String> keys = geminiProperties.getKeys();

        if (keys == null || keys.isEmpty() || targetUrl == null || targetUrl.isBlank()) {
            return generateContent(context);
        }

        String prompt = buildPrompt(context) + buildRagSection(similarPlans);

        for (String apiKey : keys) {
            if (apiKey == null || apiKey.isBlank() || "disabled".equalsIgnoreCase(apiKey.trim()) || "replace_me".equalsIgnoreCase(apiKey.trim())) {
                continue;
            }

            try {
                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(Map.of(
                                "parts", List.of(Map.of("text", prompt))
                        ))
                );
                String separator = targetUrl.contains("?") ? "&" : "?";
                String requestUrl = targetUrl + separator + "key=" + apiKey.trim();

                Map<?, ?> response = restTemplate.postForObject(
                        requestUrl,
                        requestBody,
                        Map.class
                );
                String rawText = extractText(response);
                if (rawText != null && !rawText.isBlank()) {
                    return objectMapper.readValue(stripJsonFence(rawText), GeminiRecoveryResult.class);
                }
            } catch (Exception ex) {
                log.warn("Gemini RAG generation failed with key ending in {}: {}",
                        apiKey.substring(Math.max(0, apiKey.length() - 4)), ex.getMessage());
            }
        }

        return generateContent(context);
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
                You are a Senior Technical Lead and Agile Coach in a student software project management system.
                Write a specific, highly contextual, and practical Vietnamese recovery plan for a task facing SLA risk.
                Tone: constructive, precise, professional, and actionable.

                Task context:
                - Task title: %s
                - Task description: %s
                - Blocked reason: %s
                - Open checklist items: %s
                - Subtasks: %s
                - Risk level: %s
                - Current SLA score: %s
                - SLA categories: %s
                - Overdue days: %d
                - Assignee active task count: %d
                - SLA Risk reasons: %s
                - Is follow-up after failed plan: %s
                - Previous plan count for this task: %d
                - Previous actions: %s
                - Previous effectiveness: %s
                - Last score before/after execution: %s -> %s
                - Member candidates for reassignment: %s

                Choose 1 to 3 actions from this exact whitelist only:
                [NOTIFY_ASSIGNEE, ESCALATE_LEADER, ASK_BLOCKER_UPDATE,
                 CREATE_RECOVERY_CHECKLIST, SCHEDULE_FOLLOW_UP, SUGGEST_SPLIT_TASK, SUGGEST_REASSIGN]

                Decision guidance:
                - Tailor recommendations directly to the task's title, description, and blocked reason.
                - If task is BLOCKED, include ASK_BLOCKER_UPDATE or ESCALATE_LEADER with specific questions about the blocker.
                - If task scope is large or overdue, consider SUGGEST_SPLIT_TASK with concrete sub-task breakdown ideas.
                - If assignee active task count is high, consider SUGGEST_REASSIGN from the Member candidates list.
                - For CREATE_RECOVERY_CHECKLIST, create 2 to 4 concrete, actionable checklist steps tailored to this specific task.

                Writing rules:
                - summary: 1-2 clear sentences in Vietnamese (max 45 words) summarizing the core problem and specific resolution strategy.
                - selectedActions: 1 to 3 actions.
                - action message: 1-2 actionable sentences in Vietnamese (max 40 words) explaining specifically what to do for this task.
                - checklistItems: only for CREATE_RECOVERY_CHECKLIST, 2-4 items, max 15 Vietnamese words each.
                - For SUGGEST_REASSIGN: set recommendedAssigneeId, recommendedAssigneeName, recommendedReason (max 20 words), notRecommendedAssignees.

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
                safe(context.getTaskDescription()),
                safe(context.getBlockedReason()),
                String.join("; ", nullToEmpty(context.getOpenChecklistItems())),
                String.join("; ", nullToEmpty(context.getSubTaskTitles())),
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
