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
 * Orchestrates GitHub source code scanning to extract frontend element selectors
 * (data-testid, id, name, aria-label, placeholder) and formats them for Gemini prompts.
 *
 * This enriches AI-generated test cases with real selectors from the project's codebase,
 * eliminating guessed/hallucinated selectors.
 *
 * Fail-safe: any exception is caught and logged — generation continues without enrichment.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SelectorEnrichmentService {

    @Value("${architecture.parser.url:http://localhost:4002}")
    private String architectureParserUrl;

    // Maximum character length of the selectorContext injected into the prompt.
    // Prevents prompt bloat for very large repos.
    private static final int MAX_CONTEXT_CHARS = 6000;

    private final GitHubIntegrationService gitHubIntegrationService;
    private final RestTemplate restTemplate;

    /**
     * Extracts a formatted selector context string from the project's GitHub repo.
     *
     * @param projectId  the current project
     * @param userId     the user triggering the generation (their GitHub token is used)
     * @return formatted selector context string to inject into the Gemini prompt,
     *         or {@code null} if enrichment is unavailable or fails
     */
    public String extractSelectorContext(Long projectId, Long userId) {
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

            log.info("[SelectorEnrichment] Scanning repo {} for project {}", repoUrl, projectId);

            // 3. Call architecture-parser /extract-selectors
            Map<String, Object> payload = Map.of(
                    "repoUrl", repoUrl,
                    "token", decryptedToken,
                    "branch", "main"
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    architectureParserUrl + "/extract-selectors",
                    new HttpEntity<>(payload, headers),
                    Map.class
            );

            if (response.getBody() == null) {
                log.warn("[SelectorEnrichment] Empty response from architecture-parser");
                return null;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> selectorMap =
                    (Map<String, Object>) response.getBody().get("selectorMap");

            if (selectorMap == null || selectorMap.isEmpty()) {
                log.info("[SelectorEnrichment] No selectors found in repo {} — skipping", repoUrl);
                return null;
            }

            Object totalFiles = response.getBody().get("totalFiles");
            Object totalSelectors = response.getBody().get("totalSelectors");
            log.info("[SelectorEnrichment] Found {} selectors across {} files for project {}",
                    totalSelectors, totalFiles, projectId);

            // 4. Format for Gemini prompt
            String context = formatSelectorMapForPrompt(selectorMap);

            // 5. Truncate if too large
            if (context.length() > MAX_CONTEXT_CHARS) {
                context = context.substring(0, MAX_CONTEXT_CHARS) + "\n... (truncated — too many selectors)\n";
            }

            return context;

        } catch (Exception e) {
            // Fail gracefully — enrichment is best-effort
            log.warn("[SelectorEnrichment] Failed for project {}: {}", projectId, e.getMessage());
            return null;
        }
    }

    /**
     * Converts the raw selectorMap JSON (from architecture-parser) into a
     * human-readable text block for the Gemini prompt.
     *
     * Input shape:
     * <pre>
     * {
     *   "src/pages/LoginPage.jsx": {
     *     "data-testid": ["email-input", "password-input"],
     *     "placeholder": ["Enter email"]
     *   }
     * }
     * </pre>
     */
    @SuppressWarnings("unchecked")
    private String formatSelectorMapForPrompt(Map<String, Object> selectorMap) {
        StringBuilder sb = new StringBuilder();
        sb.append("SOURCE CODE SELECTORS (extracted from GitHub frontend source):\n");
        sb.append("CRITICAL: For UI test cases, ONLY use selectors listed below. ")
          .append("Do NOT invent selectors that are not present in this list.\n");
        sb.append("If the exact element you need is missing, use the closest match ")
          .append("(e.g., button text, aria-label, or placeholder).\n\n");

        int fileCount = 0;
        for (Map.Entry<String, Object> entry : selectorMap.entrySet()) {
            if (fileCount++ >= 60) {
                sb.append("... (").append(selectorMap.size() - 60).append(" more files not shown)\n");
                break;
            }

            sb.append(entry.getKey()).append(":\n");

            Map<String, Object> attrs = (Map<String, Object>) entry.getValue();
            for (Map.Entry<String, Object> attrEntry : attrs.entrySet()) {
                List<String> values = (List<String>) attrEntry.getValue();
                sb.append("  ").append(attrEntry.getKey()).append(": ")
                  .append(String.join(", ", values)).append("\n");
            }
        }

        return sb.toString();
    }
}
