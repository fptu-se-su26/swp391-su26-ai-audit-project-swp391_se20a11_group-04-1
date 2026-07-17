package org.example.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.stream.Collectors;

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
    private final AiRoutingService aiRoutingService;
    private final ObjectMapper objectMapper;

    /**
     * Extracts a formatted selector context string from the project's GitHub repo.
     * Uses two-step AI: first AI selects relevant files, then formats only those selectors.
     *
     * @param projectId          the current project
     * @param userId             the user triggering the generation (their GitHub token is used)
     * @param requirementTitle   requirement title for AI to determine relevant files
     * @param requirementDesc    requirement description for AI to determine relevant files
     * @return formatted selector context string to inject into the Gemini prompt,
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

            log.info("[SelectorEnrichment] Scanning repo {} for project {}", repoUrl, projectId);

            // 3. Call architecture-parser /extract-selectors — get full selector map
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
            Map<String, Object> fullSelectorMap =
                    (Map<String, Object>) response.getBody().get("selectorMap");

            if (fullSelectorMap == null || fullSelectorMap.isEmpty()) {
                log.info("[SelectorEnrichment] No selectors found in repo {} — skipping", repoUrl);
                return null;
            }

            log.info("[SelectorEnrichment] Found {} files with selectors for project {}",
                    fullSelectorMap.size(), projectId);

            // 4. [TWO-STEP AI] Step 1: Let AI choose relevant files based on requirement
            List<String> relevantFiles = selectRelevantFiles(
                    fullSelectorMap, requirementTitle, requirementDesc);

            // 5. Filter selector map to only relevant files
            Map<String, Object> filteredMap;
            if (relevantFiles == null || relevantFiles.isEmpty()) {
                // Fallback: use all files but truncate aggressively
                log.warn("[SelectorEnrichment] AI file selection returned empty, using all files");
                filteredMap = fullSelectorMap;
            } else {
                log.info("[SelectorEnrichment] AI selected {} relevant files: {}",
                        relevantFiles.size(), relevantFiles);
                filteredMap = fullSelectorMap.entrySet().stream()
                        .filter(e -> relevantFiles.contains(e.getKey()))
                        .collect(Collectors.toMap(
                                e -> (String) e.getKey(),
                                e -> e.getValue()));
            }

            // 6. Format filtered map for Gemini prompt
            String context = formatSelectorMapForPrompt(filteredMap);

            // 7. Truncate if still too large
            if (context.length() > MAX_CONTEXT_CHARS) {
                context = context.substring(0, MAX_CONTEXT_CHARS) + "\n... (truncated — too many selectors)\n";
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

    /**
     * Step 1 of two-step AI: Ask AI to select which files are relevant
     * to the given requirement from the full list of scanned files.
     *
     * @param fullSelectorMap  all files and their selectors from the repo
     * @param requirementTitle the requirement title
     * @param requirementDesc  the requirement description
     * @return list of file paths AI considers relevant, or null on failure
     */
    private List<String> selectRelevantFiles(Map<String, Object> fullSelectorMap,
                                              String requirementTitle,
                                              String requirementDesc) {
        try {
            // Build a compact file list — just paths, no selectors (cheap prompt)
            StringBuilder fileList = new StringBuilder();
            for (String filePath : fullSelectorMap.keySet()) {
                fileList.append("- ").append(filePath).append("\n");
            }

            String selectionPrompt =
                "You are a software QA analyst. Your task is to identify which frontend source files " +
                "are relevant for testing the following requirement.\n\n" +
                "REQUIREMENT TITLE: " + (requirementTitle != null ? requirementTitle : "Unknown") + "\n" +
                "REQUIREMENT DESCRIPTION: " + (requirementDesc != null && !requirementDesc.isBlank()
                        ? requirementDesc : "No description provided.") + "\n\n" +
                "AVAILABLE FRONTEND FILES:\n" + fileList + "\n" +
                "TASK: Return ONLY a JSON array of file paths that contain UI elements directly " +
                "used in this feature. Rules:\n" +
                "- Include login/signin pages (.jsp, .html, .jsx, .tsx) if the requirement involves authentication or user login.\n" +
                "- Include registration/signup pages if the requirement involves user registration.\n" +
                "- Include form pages if the requirement involves data submission.\n" +
                "- Look for file names containing keywords from the requirement (e.g., 'login', 'register', 'profile', 'dashboard').\n" +
                "- Include at most 8 files. Prefer specificity over breadth.\n\n" +
                "Rules:\n" +
                "- Return ONLY a raw JSON array, no explanation, no markdown.\n" +
                "- Example: [\"src/views/auth/login.jsp\", \"src/views/auth/register.jsp\"]\n" +
                "- If no files are relevant, return: []\n";

            String rawResponse = aiRoutingService.generateText(selectionPrompt);

            // Parse the JSON array response
            String clean = rawResponse.trim();
            if (clean.startsWith("```")) {
                int newlineIdx = clean.indexOf('\n');
                clean = newlineIdx != -1 ? clean.substring(newlineIdx + 1).trim()
                                         : clean.replaceFirst("^```(json)?", "").trim();
            }
            if (clean.endsWith("```")) {
                clean = clean.substring(0, clean.length() - 3).trim();
            }
            // Extract array portion
            int start = clean.indexOf('[');
            int end = clean.lastIndexOf(']');
            if (start != -1 && end > start) {
                clean = clean.substring(start, end + 1);
            }

            return objectMapper.readValue(clean, new TypeReference<List<String>>() {});

        } catch (Exception e) {
            log.warn("[SelectorEnrichment] File selection AI call failed: {}", e.getMessage());
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
