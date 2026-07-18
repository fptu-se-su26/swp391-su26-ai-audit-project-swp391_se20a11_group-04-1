package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Orchestrates GitHub source code scanning to extract a STRUCTURED FORM MAP —
 * each interactive HTML element (input, select, textarea, button) is represented
 * as a full object with tag, type, name, id, placeholder, aria-label, resolved
 * label text, semantic role hint, and a pre-computed Playwright selector.
 *
 * This replaces the old flat-list approach (/extract-selectors) which still required
 * AI to guess which selector belonged to which element. With the structured form map,
 * AI receives the exact selector for each element with its semantic role — no guessing.
 *
 * Fail-safe: any exception is caught and logged; generation continues without enrichment.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SelectorEnrichmentService {

    @Value("${architecture.parser.url:http://localhost:4002}")
    private String architectureParserUrl;

    // Maximum character length of the context injected into the Gemini prompt.
    private static final int MAX_CONTEXT_CHARS = 8000;

    private final GitHubIntegrationService gitHubIntegrationService;
    private final RestTemplate restTemplate;

    /**
     * Extracts a structured form map from the project's GitHub repo and formats it
     * for injection into the Gemini prompt. Uses the /extract-form-map endpoint which
     * parses HTML/JSP/JSX/TSX structurally — not with flat regex extraction.
     *
     * @param projectId        the current project
     * @param userId           the user triggering the generation (their GitHub token is used)
     * @param requirementTitle requirement title — used to filter relevant files
     * @param requirementDesc  requirement description — used to filter relevant files
     * @return formatted context string to inject into the Gemini prompt,
     *         or {@code null} if enrichment is unavailable or fails
     */
    public String extractSelectorContext(Long projectId, Long userId,
                                         String requirementTitle, String requirementDesc) {
        try {
            // 1. Resolve GitHub integration for this project
            GitHubIntegration integration = gitHubIntegrationService.getIntegration(projectId, userId);
            if (integration == null) {
                log.info("[SelectorEnrichment] Project {} has no GitHub integration — skipping", projectId);
                return null;
            }

            // 2. Resolve decrypted user token
            String decryptedToken = gitHubIntegrationService.getDecryptedUserToken(userId);
            if (decryptedToken == null || decryptedToken.isBlank()) {
                log.info("[SelectorEnrichment] User {} has no GitHub token — skipping", userId);
                return null;
            }

            String repoUrl = String.format("https://github.com/%s/%s",
                    integration.getRepoOwner(), integration.getRepoName());

            log.info("[SelectorEnrichment] Scanning repo {} (form-map) for project {}", repoUrl, projectId);

            // 3. Call architecture-parser /extract-form-map — structured element objects
            Map<String, Object> payload = Map.of(
                    "repoUrl", repoUrl,
                    "token", decryptedToken,
                    "branch", "main"
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    architectureParserUrl + "/extract-form-map",
                    new HttpEntity<>(payload, headers),
                    Map.class
            );

            if (response.getBody() == null) {
                log.warn("[SelectorEnrichment] Empty response from architecture-parser /extract-form-map");
                return null;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> fullFormMap =
                    (Map<String, Object>) response.getBody().get("formMap");

            if (fullFormMap == null || fullFormMap.isEmpty()) {
                log.info("[SelectorEnrichment] No form elements found in repo {} — skipping", repoUrl);
                return null;
            }

            log.info("[SelectorEnrichment] Found {} files with form elements for project {}",
                    fullFormMap.size(), projectId);

            // 4. Filter to relevant files based on requirement keywords (no AI call needed —
            //    simple keyword matching on file path is sufficient and deterministic)
            Map<String, Object> filteredMap = filterRelevantFiles(fullFormMap, requirementTitle, requirementDesc);

            if (filteredMap.isEmpty()) {
                log.warn("[SelectorEnrichment] No relevant files found after filtering, using all {} files",
                        fullFormMap.size());
                filteredMap = fullFormMap;
            } else {
                log.info("[SelectorEnrichment] Filtered to {} relevant files: {}",
                        filteredMap.size(), filteredMap.keySet());
            }

            // 5. Format into prompt-ready text
            String context = formatFormMapForPrompt(filteredMap);

            // 6. Truncate if still too large
            if (context.length() > MAX_CONTEXT_CHARS) {
                context = context.substring(0, MAX_CONTEXT_CHARS)
                        + "\n... (truncated — too many elements)\n";
            }

            return context;

        } catch (Exception e) {
            log.warn("[SelectorEnrichment] Failed for project {}: {}", projectId, e.getMessage());
            return null;
        }
    }

    /**
     * Overload for backward compatibility — no requirement context provided.
     */
    public String extractSelectorContext(Long projectId, Long userId) {
        return extractSelectorContext(projectId, userId, "", "");
    }

    // -----------------------------------------------------------------------
    // Deterministic keyword-based file filtering (replaces AI-based selection)
    // Keyword matching on file path is faster, cheaper, and more reliable than
    // asking an AI to select files from a list.
    // -----------------------------------------------------------------------
    private Map<String, Object> filterRelevantFiles(Map<String, Object> formMap,
                                                     String requirementTitle,
                                                     String requirementDesc) {
        String combined = ((requirementTitle != null ? requirementTitle : "") + " "
                + (requirementDesc != null ? requirementDesc : "")).toLowerCase();

        // Extract keywords from requirement (words > 3 chars, strip common words)
        java.util.Set<String> stopWords = java.util.Set.of(
                "the", "and", "for", "with", "that", "this", "have", "from",
                "user", "should", "must", "will", "when", "then", "given"
        );
        String[] words = combined.split("[^a-z0-9]+");
        java.util.List<String> keywords = new java.util.ArrayList<>();
        for (String w : words) {
            if (w.length() > 3 && !stopWords.contains(w)) {
                keywords.add(w);
            }
        }

        // Always include files matching common UI page patterns for known requirement types
        java.util.List<String> alwaysInclude = new java.util.ArrayList<>();
        if (combined.matches(".*\\b(login|sign.?in|authenticate|auth)\\b.*")) {
            alwaysInclude.addAll(java.util.List.of("login", "signin", "sign_in"));
        }
        if (combined.matches(".*\\b(register|sign.?up|signup|registration)\\b.*")) {
            alwaysInclude.addAll(java.util.List.of("register", "signup", "sign_up", "registration"));
        }
        if (combined.matches(".*\\b(password|reset|forgot|forget)\\b.*")) {
            alwaysInclude.addAll(java.util.List.of("password", "reset", "forgot", "forget"));
        }
        if (combined.matches(".*\\b(otp|verif|confirm)\\b.*")) {
            alwaysInclude.addAll(java.util.List.of("otp", "verif", "confirm"));
        }
        if (combined.matches(".*\\b(profile|account|setting)\\b.*")) {
            alwaysInclude.addAll(java.util.List.of("profile", "account", "setting"));
        }
        keywords.addAll(alwaysInclude);

        if (keywords.isEmpty()) {
            return formMap; // no keywords → return all
        }

        Map<String, Object> filtered = new java.util.LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : formMap.entrySet()) {
            String path = entry.getKey().toLowerCase();
            for (String kw : keywords) {
                if (path.contains(kw)) {
                    filtered.put(entry.getKey(), entry.getValue());
                    break;
                }
            }
        }
        return filtered;
    }

    // -----------------------------------------------------------------------
    // Format structured form map into a deterministic text block for Gemini.
    // The `selector` field is pre-computed by FormMapService — AI must use it
    // verbatim, no deduction required.
    // -----------------------------------------------------------------------
    @SuppressWarnings("unchecked")
    private String formatFormMapForPrompt(Map<String, Object> formMap) {
        StringBuilder sb = new StringBuilder();
        sb.append("STRUCTURED FORM MAP — extracted verbatim from actual source code.\n");
        sb.append("Each element includes a pre-computed SELECTOR field.\n");
        sb.append("RULE: Copy the SELECTOR value CHARACTER FOR CHARACTER. No changes allowed.\n\n");

        for (Map.Entry<String, Object> fileEntry : formMap.entrySet()) {
            String filePath = fileEntry.getKey();
            Map<String, Object> fileData = (Map<String, Object>) fileEntry.getValue();
            List<Map<String, Object>> forms = (List<Map<String, Object>>) fileData.get("forms");

            if (forms == null || forms.isEmpty()) continue;

            sb.append("FILE: ").append(filePath).append("\n");

            for (Map<String, Object> form : forms) {
                String action = (String) form.getOrDefault("action", "");
                String method = (String) form.getOrDefault("method", "");
                sb.append("  FORM");
                if (action != null && !action.isBlank()) sb.append(" action=\"").append(action).append("\"");
                if (method != null && !method.isBlank()) sb.append(" method=").append(method);
                sb.append("\n");

                List<Map<String, Object>> elements = (List<Map<String, Object>>) form.get("elements");
                if (elements == null) continue;

                for (Map<String, Object> elem : elements) {
                    String role     = (String) elem.getOrDefault("role", "unknown");
                    String tag      = (String) elem.getOrDefault("tag", "input");
                    String type     = (String) elem.getOrDefault("type", "text");
                    String selector = (String) elem.getOrDefault("selector", "");
                    String name     = (String) elem.get("name");
                    String id       = (String) elem.get("id");
                    String label    = (String) elem.get("label");
                    String ph       = (String) elem.get("placeholder");
                    String text     = (String) elem.get("text");

                    String meta = "tag=" + tag + " type=" + type;
                    if (name != null) meta += " name=\"" + name + "\"";
                    if (id   != null) meta += " id=\"" + id + "\"";

                    sb.append("    [").append(role).append("] ").append(meta).append("\n");
                    if (label != null) sb.append("      label: \"").append(label).append("\"\n");
                    if (ph    != null) sb.append("      placeholder: \"").append(ph).append("\"\n");
                    if (text  != null) sb.append("      text: \"").append(text).append("\"\n");
                    sb.append("      SELECTOR (copy exactly): ").append(selector).append("\n");
                }
            }
            sb.append("\n");
        }

        return sb.toString();
    }
}
