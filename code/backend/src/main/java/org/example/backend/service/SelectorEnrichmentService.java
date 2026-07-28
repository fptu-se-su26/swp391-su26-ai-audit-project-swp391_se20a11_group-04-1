package org.example.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.UseCase;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Orchestrates 2-layer AI-assisted file selection + form map extraction.
 *
 * Layer 1 — AI File Selection:
 *   Calls /list-form-files to get all file paths (no content), then asks AI
 *   to pick the files most relevant to the requirement + use cases.
 *   This handles any language/framework because AI understands semantics,
 *   not just hardcoded keywords.
 *
 * Layer 2 — Targeted Content Extraction:
 *   Calls /extract-form-map-filtered with only the AI-selected file paths.
 *   Returns a structured form map with pre-computed Playwright selectors.
 *
 * Fail-safe: every step has a fallback — if AI selection fails, falls back
 * to extracting all files; if extraction fails, returns null (generation
 * continues without selector enrichment).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SelectorEnrichmentService {

    @Value("${architecture.parser.url:http://localhost:4002}")
    private String architectureParserUrl;

    private static final int MAX_CONTEXT_CHARS = 4000;
    private static final int MAX_FILES_FOR_AI_SELECTION = 50;
    private static final int MAX_SELECTED_FILES = 5;

    private final GitHubIntegrationService gitHubIntegrationService;
    private final RestTemplate restTemplate;
    private final AiRoutingService aiRoutingService;
    private final ObjectMapper objectMapper;

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    public String extractSelectorContext(Long projectId, Long userId,
                                         String requirementTitle, String requirementDesc) {
        return extractSelectorContext(projectId, userId, requirementTitle, requirementDesc,
                List.of(), "UI");
    }

    public String extractSelectorContext(Long projectId, Long userId) {
        return extractSelectorContext(projectId, userId, "", "", List.of(), "UI");
    }

    /**
     * Full 2-layer extraction with use case context and test type.
     *
     * @param testType "UI" or "API" — determines which files to scan
     */
    public String extractSelectorContext(Long projectId, Long userId,
                                         String requirementTitle, String requirementDesc,
                                         List<UseCase> useCases, String testType) {
        try {
            // 1. Resolve GitHub integration
            GitHubIntegration integration = gitHubIntegrationService.getIntegration(projectId, userId);
            if (integration == null) {
                log.info("[SelectorEnrichment] Project {} has no GitHub integration — skipping", projectId);
                return null;
            }
            String decryptedToken = gitHubIntegrationService.getDecryptedUserToken(userId);
            if (decryptedToken == null || decryptedToken.isBlank()) {
                log.info("[SelectorEnrichment] User {} has no GitHub token — skipping", userId);
                return null;
            }

            String repoUrl = String.format("https://github.com/%s/%s",
                    integration.getRepoOwner(), integration.getRepoName());
            log.info("[SelectorEnrichment] 2-layer scan: repo={}, type={}, project={}",
                    repoUrl, testType, projectId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // ── LAYER 1: Get file paths ──────────────────────────────────
            List<String> candidateFiles = listFilePaths(repoUrl, decryptedToken, testType, headers);
            if (candidateFiles.isEmpty()) {
                log.warn("[SelectorEnrichment] No candidate files found in repo");
                return null;
            }
            log.info("[SelectorEnrichment] Found {} candidate files", candidateFiles.size());

            // ── LAYER 1: AI selects relevant files ───────────────────────
            List<String> selectedFiles = selectRelevantFilesWithAi(
                    candidateFiles, requirementTitle, requirementDesc, useCases);
            log.info("[SelectorEnrichment] AI selected {} files: {}", selectedFiles.size(), selectedFiles);

            // ── LAYER 2: Extract form map only for selected files ─────────
            Map<String, Object> formMap = extractFormMapForFiles(
                    repoUrl, decryptedToken, selectedFiles, testType, headers);

            if (formMap == null || formMap.isEmpty()) {
                log.warn("[SelectorEnrichment] No form elements found in selected files");
                return null;
            }

            // ── Format for prompt ─────────────────────────────────────────
            String context = formatFormMapForPrompt(formMap);
            if (context.length() > MAX_CONTEXT_CHARS) {
                context = context.substring(0, MAX_CONTEXT_CHARS) + "\n... (truncated)\n";
            }
            return context;

        } catch (Exception e) {
            log.warn("[SelectorEnrichment] Failed for project {}: {}", projectId, e.getMessage());
            return null;
        }
    }

    // ------------------------------------------------------------------
    // Layer 1a: List file paths from architecture-parser
    // ------------------------------------------------------------------
    private List<String> listFilePaths(String repoUrl, String token,
                                        String testType, HttpHeaders headers) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("repoUrl", repoUrl);
            payload.put("token", token);
            payload.put("branch", "main");
            payload.put("testType", testType != null ? testType.toUpperCase() : "UI");

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    architectureParserUrl + "/list-form-files",
                    new HttpEntity<>(payload, headers),
                    Map.class
            );
            if (response.getBody() == null) return List.of();

            List<String> files = new ArrayList<>();
            String key = "API".equalsIgnoreCase(testType) ? "backendFiles" : "frontendFiles";
            Object raw = response.getBody().get(key);
            if (raw instanceof List<?> rawList) {
                rawList.forEach(f -> { if (f != null) files.add(f.toString()); });
            }
            if (files.size() > MAX_FILES_FOR_AI_SELECTION) {
                return files.subList(0, MAX_FILES_FOR_AI_SELECTION);
            }
            return files;
        } catch (Exception e) {
            log.warn("[SelectorEnrichment] /list-form-files failed: {}", e.getMessage());
            return List.of();
        }
    }

    // ------------------------------------------------------------------
    // Layer 1b: AI selects relevant files from the candidate list
    // ------------------------------------------------------------------
    private List<String> selectRelevantFilesWithAi(List<String> candidateFiles,
                                                    String requirementTitle,
                                                    String requirementDesc,
                                                    List<UseCase> useCases) {
        if (candidateFiles.isEmpty()) return List.of();

        // Build a compact use case summary (names + preconditions only — no full flows)
        String useCaseSummary = "";
        if (useCases != null && !useCases.isEmpty()) {
            StringBuilder sb = new StringBuilder("Use Cases:\n");
            for (UseCase uc : useCases) {
                sb.append("- ").append(uc.getName());
                if (uc.getPrecondition() != null && !uc.getPrecondition().isBlank()) {
                    sb.append(" (precondition: ").append(uc.getPrecondition().trim()).append(")");
                }
                sb.append("\n");
            }
            useCaseSummary = sb.toString();
        }

        String fileList = candidateFiles.stream()
                .map(f -> "- " + f)
                .collect(Collectors.joining("\n"));

        String prompt = String.format("""
                You are a test case planning assistant.
                
                REQUIREMENT: %s
                DESCRIPTION: %s
                %s
                
                From the following source code files, select UP TO %d files that are MOST RELEVANT
                to this requirement. Choose files whose names or paths suggest they implement
                the feature described (e.g. login page for authentication requirements,
                enrollment page for course registration requirements, etc.)
                
                FILES:
                %s
                
                Reply with ONLY a valid JSON array of selected file paths. No explanation.
                Example: ["src/views/auth/login.jsp", "src/views/auth/register.jsp"]
                """,
                requirementTitle != null ? requirementTitle : "",
                requirementDesc != null ? requirementDesc : "",
                useCaseSummary,
                MAX_SELECTED_FILES,
                fileList
        );

        try {
            String rawResponse = aiRoutingService.generateText(prompt);
            if (rawResponse == null || rawResponse.isBlank()) return candidateFiles;

            // Extract JSON array from response
            int start = rawResponse.indexOf('[');
            int end = rawResponse.lastIndexOf(']');
            if (start < 0 || end < 0 || end <= start) {
                log.warn("[SelectorEnrichment] AI selection response has no JSON array, using all files");
                return candidateFiles;
            }

            String jsonArray = rawResponse.substring(start, end + 1);
            List<String> selected = objectMapper.readValue(jsonArray,
                    new TypeReference<List<String>>() {});

            // Validate — only keep paths that exist in candidate list
            List<String> valid = selected.stream()
                    .filter(candidateFiles::contains)
                    .collect(Collectors.toList());

            if (valid.isEmpty()) {
                log.warn("[SelectorEnrichment] AI selected 0 valid files, falling back to all");
                return candidateFiles;
            }
            return valid;

        } catch (Exception e) {
            log.warn("[SelectorEnrichment] AI file selection failed: {}, using all candidates", e.getMessage());
            return candidateFiles;
        }
    }

    // ------------------------------------------------------------------
    // Layer 2: Extract form map only for selected files
    // ------------------------------------------------------------------
    @SuppressWarnings({"unchecked", "rawtypes"})
    private Map<String, Object> extractFormMapForFiles(String repoUrl, String token,
                                                        List<String> filePaths,
                                                        String testType,
                                                        HttpHeaders headers) {
        try {
            if ("API".equalsIgnoreCase(testType)) {
                return null;
            }

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("repoUrl", repoUrl);
            payload.put("token", token);
            payload.put("branch", "main");
            payload.put("filePaths", filePaths);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    architectureParserUrl + "/extract-form-map-filtered",
                    new HttpEntity<>(payload, headers),
                    Map.class
            );
            if (response.getBody() == null) return Map.of();

            Object raw = response.getBody().get("formMap");
            if (raw instanceof Map<?, ?> rawMap) {
                return (Map<String, Object>) rawMap;
            }
            return Map.of();

        } catch (Exception e) {
            log.warn("[SelectorEnrichment] /extract-form-map-filtered failed: {}, trying full scan", e.getMessage());
            return extractFormMapFull(repoUrl, token, headers);
        }
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private Map<String, Object> extractFormMapFull(String repoUrl, String token, HttpHeaders headers) {
        try {
            Map<String, Object> payload = Map.of("repoUrl", repoUrl, "token", token, "branch", "main");
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    architectureParserUrl + "/extract-form-map",
                    new HttpEntity<>(payload, headers),
                    Map.class
            );
            if (response.getBody() == null) return Map.of();
            Object raw = response.getBody().get("formMap");
            if (raw instanceof Map<?, ?> rawMap) return (Map<String, Object>) rawMap;
            return Map.of();
        } catch (Exception e) {
            log.warn("[SelectorEnrichment] Full form map fallback failed: {}", e.getMessage());
            return Map.of();
        }
    }

    // ------------------------------------------------------------------
    // Format structured form map into prompt-ready text
    // ------------------------------------------------------------------
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
