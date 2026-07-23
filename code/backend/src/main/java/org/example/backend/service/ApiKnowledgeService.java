package org.example.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * ApiKnowledgeService
 * ====================
 * Mirrors {@link SelectorEnrichmentService} but extracts API endpoint knowledge
 * from Java Spring Boot source code instead of frontend selectors.
 *
 * Flow:
 *   1. Resolve GitHubIntegration + decrypted token for the project
 *   2. Check Redis cache (TTL 30 min) — skip expensive clone on cache hit
 *   3. POST to architecture-parser /extract-api-knowledge — clone + static parse
 *   4. Filter endpoints relevant to the requirement (keyword matching)
 *   5. Cap at MAX_ENDPOINTS_IN_CONTEXT endpoints
 *   6. Format into a prompt-ready string and return
 *
 * Fail-safe: any exception is caught and logged; returns null so generation continues
 * without API context (same pattern as SelectorEnrichmentService).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApiKnowledgeService {

    @Value("${architecture.parser.url:http://localhost:4002}")
    private String architectureParserUrl;

    /** Maximum characters of API context injected into the Gemini prompt. */
    private static final int MAX_CONTEXT_CHARS        = 10_000;
    private static final int MAX_ENDPOINTS_IN_CONTEXT = 30;
    private static final long CACHE_TTL_MINUTES       = 30;
    private static final String CACHE_KEY_PREFIX      = "api-knowledge:";

    private final GitHubIntegrationService gitHubIntegrationService;
    private final RestTemplate             restTemplate;
    private final StringRedisTemplate      redisTemplate;
    private final ObjectMapper             objectMapper;

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Extracts API endpoint knowledge and formats it for Gemini prompt injection.
     *
     * @param projectId        current project ID
     * @param userId           user triggering generation (their GitHub token is used)
     * @param requirementTitle requirement title — used to filter relevant endpoints
     * @param requirementDesc  requirement description — used to filter relevant endpoints
     * @return formatted API knowledge string, or {@code null} if unavailable / error
     */
    public String extractApiKnowledgeContext(Long projectId, Long userId,
                                              String requirementTitle,
                                              String requirementDesc) {
        try {
            // 1. Resolve GitHub integration
            GitHubIntegration integration = gitHubIntegrationService.getIntegration(projectId, userId);
            if (integration == null) {
                log.info("[ApiKnowledge] Project {} has no GitHub integration — skipping", projectId);
                return null;
            }

            String decryptedToken = gitHubIntegrationService.getDecryptedUserToken(userId);
            if (decryptedToken == null || decryptedToken.isBlank()) {
                log.info("[ApiKnowledge] User {} has no GitHub token — skipping", userId);
                return null;
            }

            String repoUrl = String.format("https://github.com/%s/%s",
                    integration.getRepoOwner(), integration.getRepoName());

            log.info("[ApiKnowledge] Scanning repo {} for API knowledge (project {})", repoUrl, projectId);

            // 2. Check Redis cache
            String cacheKey = buildCacheKey(projectId, repoUrl);
            List<Map<String, Object>> endpoints = loadFromCache(cacheKey);

            // 3. Cache miss — call architecture-parser
            if (endpoints == null) {
                endpoints = callExtractApiKnowledge(repoUrl, decryptedToken);
                if (endpoints != null && !endpoints.isEmpty()) {
                    saveToCache(cacheKey, endpoints);
                }
            }

            if (endpoints == null || endpoints.isEmpty()) {
                log.info("[ApiKnowledge] No endpoints extracted for project {}", projectId);
                return null;
            }

            log.info("[ApiKnowledge] Extracted {} endpoints for project {}", endpoints.size(), projectId);

            // 4. Filter to relevant endpoints
            List<Map<String, Object>> filtered =
                    filterRelevantEndpoints(endpoints, requirementTitle, requirementDesc);
            if (filtered.isEmpty()) {
                boolean hasRequirementContext =
                        (requirementTitle != null && !requirementTitle.isBlank())
                                || (requirementDesc != null && !requirementDesc.isBlank());
                if (hasRequirementContext) {
                    log.info("[ApiKnowledge] No relevant endpoints after filtering for project {} — skipping API context to avoid unrelated API test cases",
                            projectId);
                    return null;
                }
                log.info("[ApiKnowledge] No requirement context supplied — using all {} endpoints", endpoints.size());
                filtered = endpoints;
            }

            // 5. Cap and format
            List<Map<String, Object>> capped = filtered.stream()
                    .limit(MAX_ENDPOINTS_IN_CONTEXT)
                    .collect(Collectors.toList());

            String context = formatEndpointsForPrompt(capped);
            if (context.length() > MAX_CONTEXT_CHARS) {
                context = context.substring(0, MAX_CONTEXT_CHARS) + "\n...(truncated)\n";
            }
            return context;

        } catch (Exception e) {
            log.warn("[ApiKnowledge] Failed for project {}: {}", projectId, e.getMessage());
            return null;
        }
    }

    /** Overload for backward compatibility — no requirement context provided. */
    public String extractApiKnowledgeContext(Long projectId, Long userId) {
        return extractApiKnowledgeContext(projectId, userId, "", "");
    }

    // -----------------------------------------------------------------------
    // Architecture-parser call
    // -----------------------------------------------------------------------

    @SuppressWarnings({"unchecked", "rawtypes"})
    private List<Map<String, Object>> callExtractApiKnowledge(String repoUrl, String token) {
        Map<String, Object> payload = Map.of(
                "repoUrl", repoUrl,
                "token",   token,
                "branch",  "main"
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                architectureParserUrl + "/extract-api-knowledge",
                new HttpEntity<>(payload, headers),
                Map.class
        );

        if (response.getBody() == null) {
            log.warn("[ApiKnowledge] Empty response from architecture-parser");
            return null;
        }

        Object raw = response.getBody().get("endpoints");
        if (!(raw instanceof List)) {
            return null;
        }
        return (List<Map<String, Object>>) raw;
    }

    // -----------------------------------------------------------------------
    // Redis cache helpers
    // -----------------------------------------------------------------------

    private String buildCacheKey(Long projectId, String repoUrl) {
        // Simple hash to avoid overly long keys
        int hash = (projectId + ":" + repoUrl).hashCode();
        return CACHE_KEY_PREFIX + projectId + ":" + Integer.toHexString(Math.abs(hash));
    }

    private List<Map<String, Object>> loadFromCache(String key) {
        try {
            String cached = redisTemplate.opsForValue().get(key);
            if (cached == null || cached.isBlank()) return null;
            return objectMapper.readValue(cached,
                    new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            log.debug("[ApiKnowledge] Cache read failed for key {}: {}", key, e.getMessage());
            return null;
        }
    }

    private void saveToCache(String key, List<Map<String, Object>> endpoints) {
        try {
            String json = objectMapper.writeValueAsString(endpoints);
            redisTemplate.opsForValue().set(key, json, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.debug("[ApiKnowledge] Cache write failed for key {}: {}", key, e.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    // Keyword-based endpoint filtering (mirrors SelectorEnrichmentService pattern)
    // -----------------------------------------------------------------------

    private List<Map<String, Object>> filterRelevantEndpoints(
            List<Map<String, Object>> endpoints,
            String requirementTitle, String requirementDesc) {

        String combined = ((requirementTitle != null ? requirementTitle : "") + " "
                + (requirementDesc != null ? requirementDesc : "")).toLowerCase();

        Set<String> stopWords = Set.of(
                "the", "and", "for", "with", "that", "this", "have", "from",
                "user", "should", "must", "will", "when", "then", "given"
        );
        String[] words = combined.split("[^a-z0-9]+");
        List<String> keywords = new ArrayList<>();
        for (String w : words) {
            if (w.length() > 3 && !stopWords.contains(w)) {
                keywords.add(w);
            }
        }

        // Domain-specific expansions (same pattern as SelectorEnrichmentService)
        if (combined.matches(".*\\b(login|sign.?in|authenticate|auth)\\b.*")) {
            keywords.addAll(List.of("auth", "login", "token", "signin"));
        }
        if (combined.matches(".*\\b(register|sign.?up|signup|registration)\\b.*")) {
            keywords.addAll(List.of("register", "signup", "user"));
        }
        if (combined.matches(".*\\b(task|ticket)\\b.*")) {
            keywords.addAll(List.of("task", "ticket"));
        }
        if (combined.matches(".*\\b(sprint)\\b.*")) {
            keywords.add("sprint");
        }
        if (combined.matches(".*\\b(project)\\b.*")) {
            keywords.add("project");
        }

        if (keywords.isEmpty()) {
            return endpoints;
        }

        return endpoints.stream()
                .filter(ep -> matchesKeywords(ep, keywords))
                .collect(Collectors.toList());
    }

    private boolean matchesKeywords(Map<String, Object> ep, List<String> keywords) {
        String path       = String.valueOf(ep.getOrDefault("path", "")).toLowerCase();
        String controller = String.valueOf(ep.getOrDefault("controllerClass", "")).toLowerCase();
        String method     = String.valueOf(ep.getOrDefault("methodName", "")).toLowerCase();

        Object rb = ep.get("requestBody");
        String bodyClass = "";
        if (rb instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> rbMap = (Map<String, Object>) rb;
            bodyClass = String.valueOf(rbMap.getOrDefault("className", "")).toLowerCase();
        }

        for (String kw : keywords) {
            if (path.contains(kw) || controller.contains(kw)
                    || method.contains(kw) || bodyClass.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    // -----------------------------------------------------------------------
    // Prompt formatting
    // -----------------------------------------------------------------------

    @SuppressWarnings("unchecked")
    private String formatEndpointsForPrompt(List<Map<String, Object>> endpoints) {
        StringBuilder sb = new StringBuilder();
        sb.append("API KNOWLEDGE — extracted by static analysis of backend source code.\n");
        sb.append("Supports Spring mappings and Servlet @WebServlet endpoints. NO guessing.\n");
        sb.append("Every value below comes directly from source annotations/methods.\n\n");

        for (int i = 0; i < endpoints.size(); i++) {
            Map<String, Object> ep = endpoints.get(i);
            sb.append("ENDPOINT ").append(i + 1).append(": ")
              .append(ep.getOrDefault("httpMethod", "GET")).append(" ")
              .append(ep.getOrDefault("path", "/")).append("\n");
            sb.append("  Controller: ").append(ep.getOrDefault("controllerClass", ""))
              .append(".").append(ep.getOrDefault("methodName", "")).append("()\n");
            sb.append("  Description: ").append(ep.getOrDefault("description", "")).append("\n");

            // Authentication
            Object authObj = ep.get("authentication");
            if (authObj instanceof Map) {
                Map<String, Object> auth = (Map<String, Object>) authObj;
                boolean required = Boolean.TRUE.equals(auth.get("required"));
                if (required) {
                    Object roles = auth.get("roles");
                    String rolesStr = (roles instanceof List && !((List<?>) roles).isEmpty())
                            ? " — roles: " + roles
                            : "";
                    sb.append("  Auth: Required").append(rolesStr).append("\n");
                } else {
                    sb.append("  Auth: Public (no authentication required)\n");
                }
            }

            // Path variables
            Object pvObj = ep.get("pathVariables");
            if (pvObj instanceof List && !((List<?>) pvObj).isEmpty()) {
                sb.append("  Path Variables:\n");
                for (Object pv : (List<?>) pvObj) {
                    if (pv instanceof Map) {
                        Map<String, Object> f = (Map<String, Object>) pv;
                        sb.append("    ").append(f.get("name"))
                          .append(" (").append(f.get("javaType")).append(", required)\n");
                    }
                }
            }

            // Query params
            Object qpObj = ep.get("queryParams");
            if (qpObj instanceof List && !((List<?>) qpObj).isEmpty()) {
                sb.append("  Query Params:\n");
                for (Object qp : (List<?>) qpObj) {
                    if (qp instanceof Map) {
                        Map<String, Object> f = (Map<String, Object>) qp;
                        boolean req = Boolean.TRUE.equals(f.get("required"));
                        String def = f.get("defaultValue") != null
                                ? ", default: " + f.get("defaultValue") : "";
                        sb.append("    ").append(f.get("name"))
                          .append(" (").append(f.get("javaType")).append(", ")
                          .append(req ? "required" : "optional").append(def).append(")\n");
                    }
                }
            }

            // Request body
            Object rbObj = ep.get("requestBody");
            if (rbObj instanceof Map) {
                Map<String, Object> rb = (Map<String, Object>) rbObj;
                sb.append("  Request Body: ").append(rb.get("className")).append("\n");
                Object fieldsObj = rb.get("fields");
                if (fieldsObj instanceof List) {
                    for (Object fObj : (List<?>) fieldsObj) {
                        if (fObj instanceof Map) {
                            Map<String, Object> field = (Map<String, Object>) fObj;
                            boolean req = Boolean.TRUE.equals(field.get("required"));
                            sb.append("    ").append(field.get("jsonName"))
                              .append(" (").append(field.get("javaType")).append(", ")
                              .append(req ? "required" : "optional").append(")");
                            Object vals = field.get("validations");
                            if (vals instanceof List && !((List<?>) vals).isEmpty()) {
                                sb.append(" — constraints: ").append(formatValidations((List<?>) vals));
                            }
                            sb.append("\n");
                        }
                    }
                }
            }

            // Expected status
            Object statusObj = ep.get("expectedStatuses");
            if (statusObj instanceof List && !((List<?>) statusObj).isEmpty()) {
                sb.append("  Expected Status: ").append(statusObj).append("\n");
            }

            sb.append("\n");
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String formatValidations(List<?> validations) {
        List<String> parts = new ArrayList<>();
        for (Object v : validations) {
            if (!(v instanceof Map)) continue;
            Map<String, Object> val = (Map<String, Object>) v;
            String type = String.valueOf(val.get("type"));
            switch (type) {
                case "EMAIL"   -> parts.add("email format");
                case "PATTERN" -> parts.add("pattern=" + val.get("regexp"));
                case "MIN"     -> parts.add("min=" + val.get("value"));
                case "MAX"     -> parts.add("max=" + val.get("value"));
                case "SIZE"    -> {
                    String s = "size";
                    if (val.containsKey("min")) s += ">=" + val.get("min");
                    if (val.containsKey("max")) s += "<=" + val.get("max");
                    parts.add(s);
                }
            }
        }
        return String.join(", ", parts);
    }
}
