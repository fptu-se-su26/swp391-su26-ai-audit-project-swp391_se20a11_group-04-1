package org.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.json.JsonReadFeature;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.testing.AiDraftTestCase;
import org.example.backend.dto.testing.AiTestCaseGenerateRequest;
import org.example.backend.dto.testing.AiTestCaseGenerateResponse;
import org.example.backend.dto.testing.TestStepRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.UseCase;
import org.example.backend.entity.enums.TestType;
import org.example.backend.exception.BusinessException;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UseCaseRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AiTestCaseGeneratorService {

    private final ObjectMapper objectMapper;
    private final RequirementRepository requirementRepository;
    private final UseCaseRepository useCaseRepository;
    private final org.example.backend.repository.AiGenerationStagingRepository stagingRepository;
    private final org.example.backend.repository.TestCaseRepository testCaseRepository;
    private final AiRoutingService aiRoutingService;

    public AiTestCaseGeneratorService(
            ObjectMapper objectMapper,
            RequirementRepository requirementRepository,
            UseCaseRepository useCaseRepository,
            org.example.backend.repository.AiGenerationStagingRepository stagingRepository,
            org.example.backend.repository.TestCaseRepository testCaseRepository,
            AiRoutingService aiRoutingService) {
        this.objectMapper = objectMapper;
        this.requirementRepository = requirementRepository;
        this.useCaseRepository = useCaseRepository;
        this.stagingRepository = stagingRepository;
        this.testCaseRepository = testCaseRepository;
        this.aiRoutingService = aiRoutingService;
    }

    public AiTestCaseGenerateResponse generateTestCases(AiTestCaseGenerateRequest request) {
        return generateTestCases(request, null, null, null);
    }

    public AiTestCaseGenerateResponse generateTestCases(AiTestCaseGenerateRequest request, String selectorContext) {
        return generateTestCases(request, selectorContext, null, null);
    }

    public AiTestCaseGenerateResponse generateTestCases(AiTestCaseGenerateRequest request,
                                                         String selectorContext,
                                                         String apiKnowledgeContext) {
        return generateTestCases(request, selectorContext, apiKnowledgeContext, null);
    }

    public AiTestCaseGenerateResponse generateTestCases(AiTestCaseGenerateRequest request,
                                                         String selectorContext,
                                                         String apiKnowledgeContext,
                                                         Long projectId) {
        String requirementContext = "";
        String useCaseContext = "";
        Requirement req = null;
        List<UseCase> useCases = List.of();
        if (request.getRequirementId() != null) {
            req = requirementRepository.findById(request.getRequirementId()).orElse(null);
            if (req != null) {
                // validateAiGenerationConstraints is now called before calling this method


                requirementContext = "REQUIREMENT DETAILS:\n" +
                        "Title: " + req.getTitle() + "\n" +
                        "Description: " + (req.getDescription() != null ? req.getDescription() : "None") + "\n" +
                        "Priority: " + (req.getPriority() != null ? req.getPriority().name() : "Not set") + "\n" +
                        "Acceptance Criteria:\n" + formatAcceptanceCriteriaForPrompt(req.getAcceptanceCriteria()) + "\n\n";

                // Fetch linked Use Cases (avoid LazyInitializationException)
                useCases = useCaseRepository.findByRequirementId(req.getId());
                if (!useCases.isEmpty()) {
                    StringBuilder ucBuilder = new StringBuilder("LINKED USE CASES:\n");
                    for (int i = 0; i < useCases.size(); i++) {
                        UseCase uc = useCases.get(i);
                        ucBuilder.append("Use Case ").append(i + 1).append(": ").append(uc.getName()).append("\n");
                        ucBuilder.append("  Precondition: ").append(uc.getPrecondition() != null ? uc.getPrecondition() : "None").append("\n");
                        ucBuilder.append("  Postcondition: ").append(uc.getPostcondition() != null ? uc.getPostcondition() : "None").append("\n");
                        ucBuilder.append("  Main Flow:\n").append(formatFlowForPrompt(uc.getMainFlow(), "    ")).append("\n");
                        ucBuilder.append("  Alternative Flow:\n").append(formatFlowForPrompt(uc.getAlternativeFlow(), "    ")).append("\n\n");
                    }
                    useCaseContext = ucBuilder.toString();
                }
            }
        }

        String prompt = buildPrompt(request.getTestType(), request.isSmartMode(), requirementContext,
                useCaseContext, request.getAdditionalContext(), selectorContext, apiKnowledgeContext);

        // Use GeminiService (with key rotation, 503 retry, and OpenRouter fallback)
        String rawJson = aiRoutingService.generateText(prompt);
        AiTestCaseGenerateResponse generatedResponse = parseJsonObject(rawJson, new TypeReference<AiTestCaseGenerateResponse>() {});

        if (generatedResponse != null && generatedResponse.getTestCases() != null) {
            List<AiDraftTestCase> sanitizedDrafts = generatedResponse.getTestCases().stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toCollection(ArrayList::new));
            generatedResponse.setTestCases(sanitizedDrafts);
            for (AiDraftTestCase generatedRequest : generatedResponse.getTestCases()) {
                if (!request.isSmartMode() && request.getTestType() != null) {
                    generatedRequest.setType(request.getTestType());
                }
                if (request.getRequirementId() != null) {
                    generatedRequest.setRequirementId(request.getRequirementId());
                }
                normalizeExecutableDraft(generatedRequest, selectorContext, apiKnowledgeContext);
            }
            validateGeneratedDrafts(generatedResponse.getTestCases(), req, useCases, selectorContext, apiKnowledgeContext, projectId);
        }
        return generatedResponse;
    }

    private void normalizeExecutableDraft(AiDraftTestCase draft, String selectorContext, String apiKnowledgeContext) {
        if (draft == null) return;

        TestType inferredType = inferExecutableType(draft);
        if (inferredType == TestType.API
                && (draft.getType() == null || draft.getType() == TestType.UI || draft.getType() == TestType.MANUAL)) {
            draft.setType(TestType.API);
        }

        if (draft.getType() == TestType.API) {
            normalizeApiConfiguration(draft, apiKnowledgeContext);
        } else if (draft.getType() == TestType.UI) {
            repairUiConfigurationFromSource(draft, selectorContext);
        }
    }

    private TestType inferExecutableType(AiDraftTestCase draft) {
        JsonNode config = objectMapper.valueToTree(draft.getConfiguration());
        if (config != null && config.isObject()) {
            String configType = config.path("type").asText("");
            if ("API".equalsIgnoreCase(configType)) return TestType.API;
            if (config.has("apiMethod") || config.has("apiUrl") || config.has("apiEndpoint")
                    || config.has("apiAssertions") || config.has("apiBody")) {
                return TestType.API;
            }
        }

        String searchableText = buildDraftSearchText(draft, config);
        return containsApiRequest(searchableText) ? TestType.API : draft.getType();
    }

    private String buildDraftSearchText(AiDraftTestCase draft, JsonNode config) {
        StringBuilder sb = new StringBuilder();
        if (draft.getTitle() != null) sb.append(draft.getTitle()).append(' ');
        if (draft.getPrecondition() != null) sb.append(draft.getPrecondition()).append(' ');
        if (draft.getExpectedResult() != null) sb.append(draft.getExpectedResult()).append(' ');
        if (draft.getSteps() != null) {
            for (TestStepRequest step : draft.getSteps()) {
                if (step != null && step.getDescription() != null) {
                    sb.append(step.getDescription()).append(' ');
                }
            }
        }
        if (config != null && !config.isMissingNode() && !config.isNull()) {
            sb.append(config);
        }
        return sb.toString();
    }

    private boolean containsApiRequest(String text) {
        if (text == null || text.isBlank()) return false;
        Pattern requestPattern = Pattern.compile("\\b(GET|POST|PUT|PATCH|DELETE)\\s+(https?://\\S+|/[A-Za-z0-9_./{}?=&:-]+)", Pattern.CASE_INSENSITIVE);
        return requestPattern.matcher(text).find();
    }

    private void normalizeApiConfiguration(AiDraftTestCase draft, String apiKnowledgeContext) {
        JsonNode config = objectMapper.valueToTree(draft.getConfiguration());
        com.fasterxml.jackson.databind.node.ObjectNode normalized = objectMapper.createObjectNode();
        if (config != null && config.isObject()) {
            normalized.setAll((com.fasterxml.jackson.databind.node.ObjectNode) config);
        }

        List<ApiEndpointSpec> endpoints = extractApiEndpoints(apiKnowledgeContext);
        String searchableText = buildDraftSearchText(draft, config);
        String method = firstNonBlank(
                readTextField(normalized, "apiMethod", "method", "httpMethod"),
                inferHttpMethod(searchableText)
        );
        method = method == null ? "" : method.trim().toUpperCase(Locale.ROOT);

        String configuredUrl = firstNonBlank(
                readTextField(normalized, "apiUrl", "apiEndpoint", "url", "endpoint"),
                ""
        );
        String inferredPath = inferApiPath(searchableText);
        String apiUrl = !isBlank(configuredUrl) ? configuredUrl.trim() : inferredPath;
        if (!isBlank(inferredPath) && looksLikeFrontendUrlOnly(apiUrl)) {
            apiUrl = inferredPath;
        }
        if (!isBlank(apiUrl) && apiUrl.startsWith("/")) {
            apiUrl = "http://localhost:8080" + apiUrl;
        }

        ApiEndpointSpec matchedEndpoint = null;
        if (isBlank(apiUrl)) {
            matchedEndpoint = findEndpointByDraftIntent(endpoints, draft, method);
            if (matchedEndpoint != null) {
                method = matchedEndpoint.method;
                apiUrl = "http://localhost:8080" + matchedEndpoint.path;
            }
        }
        if (isBlank(method)) method = "GET";
        if (!isBlank(apiUrl)) {
            matchedEndpoint = findEndpoint(endpoints, method, extractApiPath(apiUrl));
        }
        if (matchedEndpoint == null && !isBlank(inferredPath)) {
            matchedEndpoint = findEndpoint(endpoints, method, inferredPath);
            if (matchedEndpoint != null) {
                apiUrl = "http://localhost:8080" + matchedEndpoint.path;
            }
        }

        normalized.put("type", "API");
        normalized.put("apiMethod", method);
        normalized.put("apiUrl", apiUrl);
        ensureObjectField(normalized, "apiHeaders", objectMapper.createObjectNode().put("Content-Type", "application/json"));
        ensureObjectField(normalized, "apiQueryParams", objectMapper.createObjectNode());

        JsonNode body = normalized.get("apiBody");
        if (body == null || !body.isObject()
                || (body.size() == 0 && matchedEndpoint != null && !matchedEndpoint.fields.isEmpty())) {
            normalized.set("apiBody", buildSampleApiBody(matchedEndpoint, draft));
        }

        JsonNode assertions = normalized.has("apiAssertions") ? normalized.get("apiAssertions") : normalized.get("assertions");
        if (assertions == null || !assertions.isArray() || assertions.isEmpty()) {
            com.fasterxml.jackson.databind.node.ArrayNode defaultAssertions = objectMapper.createArrayNode();
            com.fasterxml.jackson.databind.node.ObjectNode statusAssertion = objectMapper.createObjectNode();
            statusAssertion.put("type", "STATUS_CODE");
            statusAssertion.put("operator", "EQUALS");
            statusAssertion.put("expectedValue", String.valueOf(inferExpectedStatus(draft, matchedEndpoint)));
            defaultAssertions.add(statusAssertion);
            normalized.set("apiAssertions", defaultAssertions);
        } else if (!normalized.has("apiAssertions")) {
            normalized.set("apiAssertions", assertions);
        }

        draft.setConfiguration(normalized);
    }

    private String inferHttpMethod(String text) {
        if (text == null) return "";
        Matcher matcher = Pattern.compile("\\b(GET|POST|PUT|PATCH|DELETE)\\s+(?:https?://\\S+|/[A-Za-z0-9_./{}?=&:-]+)", Pattern.CASE_INSENSITIVE)
                .matcher(text);
        return matcher.find() ? matcher.group(1).toUpperCase(Locale.ROOT) : "";
    }

    private String inferApiPath(String text) {
        if (text == null) return "";
        Matcher matcher = Pattern.compile("\\b(?:GET|POST|PUT|PATCH|DELETE)\\s+(https?://\\S+|/[A-Za-z0-9_./{}?=&:-]+)", Pattern.CASE_INSENSITIVE)
                .matcher(text);
        if (!matcher.find()) return "";
        return extractApiPath(matcher.group(1));
    }

    private boolean looksLikeFrontendUrlOnly(String url) {
        if (isBlank(url)) return false;
        String trimmed = url.trim().toLowerCase(Locale.ROOT);
        return trimmed.matches("https?://[^/]+/?") || trimmed.contains("localhost:5173");
    }

    private void ensureObjectField(com.fasterxml.jackson.databind.node.ObjectNode node,
                                   String fieldName,
                                   com.fasterxml.jackson.databind.node.ObjectNode fallback) {
        JsonNode value = node.get(fieldName);
        if (value == null || !value.isObject()) {
            node.set(fieldName, fallback);
        }
    }

    private com.fasterxml.jackson.databind.node.ObjectNode buildSampleApiBody(ApiEndpointSpec endpoint, AiDraftTestCase draft) {
        com.fasterxml.jackson.databind.node.ObjectNode body = objectMapper.createObjectNode();
        if (endpoint == null || endpoint.fields.isEmpty()) return body;

        for (ApiFieldSpec field : endpoint.fields.values()) {
            if (field.required || "positive".equalsIgnoreCase(draft.getScenarioType())) {
                putSampleValue(body, field.name, draft);
            }
        }
        return body;
    }

    private void putSampleValue(com.fasterxml.jackson.databind.node.ObjectNode body, String fieldName, AiDraftTestCase draft) {
        String normalizedField = fieldName == null ? "" : fieldName.toLowerCase(Locale.ROOT);
        String title = draft.getTitle() == null ? "" : draft.getTitle().toLowerCase(Locale.ROOT);

        if (normalizedField.contains("password")) {
            body.put(fieldName, title.contains("wrong") || title.contains("invalid") ? "wrongpassword" : "password123");
        } else if (normalizedField.contains("email")) {
            body.put(fieldName, title.contains("invalid") && title.contains("email") ? "invalid-email" : "test@example.com");
        } else if (normalizedField.contains("username") || normalizedField.contains("user") || normalizedField.contains("input")) {
            body.put(fieldName, "testuser");
        } else if (normalizedField.contains("otp") || normalizedField.contains("code")) {
            body.put(fieldName, title.contains("invalid") ? "000000" : "123456");
        } else if (normalizedField.contains("token")) {
            body.put(fieldName, "sample-token");
        } else {
            body.put(fieldName, "sample");
        }
    }

    private int inferExpectedStatus(AiDraftTestCase draft, ApiEndpointSpec endpoint) {
        String text = ((draft.getTitle() != null ? draft.getTitle() : "") + " "
                + (draft.getExpectedResult() != null ? draft.getExpectedResult() : "")).toLowerCase(Locale.ROOT);
        Matcher explicitStatus = Pattern.compile("\\b([1-5]\\d{2})\\b").matcher(text);
        if (explicitStatus.find()) {
            return Integer.parseInt(explicitStatus.group(1));
        }
        if (text.matches(".*(too many|rate limit|lockout|locked).*")) return 429;
        if (text.matches(".*(forbidden|not authorized|unauthori[sz]ed role).*")) return 403;
        if (text.matches(".*(wrong password|invalid credential|unauthori[sz]ed|invalid token).*")) return 401;
        if (text.matches(".*(missing|required|validation|invalid|bad request|empty|null).*")) return 400;
        if (text.matches(".*(not found|unknown).*")) return 404;
        if (endpoint != null && !endpoint.expectedStatuses.isEmpty()) {
            return endpoint.expectedStatuses.stream().filter(status -> status >= 200 && status < 300).findFirst()
                    .orElse(endpoint.expectedStatuses.iterator().next());
        }
        return 200;
    }

    private void repairUiConfigurationFromSource(AiDraftTestCase draft, String selectorContext) {
        if (selectorContext == null || selectorContext.isBlank()) return;
        JsonNode config = objectMapper.valueToTree(draft.getConfiguration());

        // Build a mutable config object — create empty one if missing
        com.fasterxml.jackson.databind.node.ObjectNode configObject;
        if (config == null || !config.isObject()) {
            configObject = objectMapper.createObjectNode();
            configObject.put("type", "UI");
        } else {
            configObject = (com.fasterxml.jackson.databind.node.ObjectNode) config;
        }

        JsonNode stepsNode = configObject.path("steps");

        // If configuration has no steps array, try building one from root-level steps
        if (!stepsNode.isArray() || stepsNode.isEmpty()) {
            if (draft.getSteps() != null && !draft.getSteps().isEmpty()) {
                com.fasterxml.jackson.databind.node.ArrayNode builtSteps = objectMapper.createArrayNode();
                int order = 1;
                for (TestStepRequest s : draft.getSteps()) {
                    if (s == null) continue;
                    com.fasterxml.jackson.databind.node.ObjectNode stepNode = objectMapper.createObjectNode();
                    stepNode.put("order", order++);
                    stepNode.put("description", s.getDescription() != null ? s.getDescription() : "");
                    builtSteps.add(stepNode);
                }
                configObject.set("steps", builtSteps);
                stepsNode = builtSteps; // ← re-assign để loop dưới dùng array mới
            }
        }

        if (!stepsNode.isArray()) return;

        List<SelectorSource> sources = parseSelectorSources(selectorContext);
        log.info("[SelectorRepair] draft='{}' selectorContextLen={} parsedSources={} steps={}",
                draft.getTitle(), selectorContext.length(), sources.size(), stepsNode.size());
        if (sources.isEmpty()) return;
        Set<String> knownSelectors = sources.stream()
                .map(source -> source.selector)
                .filter(selector -> selector != null && !selector.isBlank())
                .collect(Collectors.toSet());

        String gotoPath = firstGotoPath(stepsNode);
        if (isBlank(gotoPath) || isPlaceholderSelector(gotoPath)) {
            String inferredPath = inferRouteFromTitleOrSources(draft, sources);
            if (!isBlank(inferredPath)) {
                for (JsonNode stepNode : stepsNode) {
                    if (stepNode != null && stepNode.isObject()) {
                        com.fasterxml.jackson.databind.node.ObjectNode step = (com.fasterxml.jackson.databind.node.ObjectNode) stepNode;
                        String action = normalizeUiAction(
                                readTextField(step, "action", "type", "command"),
                                readTextField(step, "description", "title")
                        );
                        if (!"goto".equals(action)) {
                            continue;
                        }
                        step.put("action", action);
                        step.put("path", inferredPath);
                        gotoPath = inferredPath;
                        break;
                    }
                }
            }
        }

        final String effectiveGotoPath = gotoPath;
        boolean pageSpecificSourcesExist = !isBlank(effectiveGotoPath)
                && sources.stream().anyMatch(source -> sourceMatchesGotoPath(source, effectiveGotoPath));

        for (JsonNode stepNode : stepsNode) {
            if (stepNode == null || !stepNode.isObject()) continue;
            com.fasterxml.jackson.databind.node.ObjectNode step = (com.fasterxml.jackson.databind.node.ObjectNode) stepNode;
            String action = normalizeUiAction(
                    readTextField(step, "action", "type", "command"),
                    readTextField(step, "description", "title")
            );
            if (!isBlank(action)) {
                step.put("action", action);
            }
            if ("goto".equals(action)) {
                String path = readTextField(step, "path", "url", "href");
                if (isBlank(path) || isPlaceholderSelector(path)) {
                    String inferredPath = !isBlank(effectiveGotoPath)
                            ? effectiveGotoPath
                            : inferRouteFromTitleOrSources(draft, sources);
                    if (!isBlank(inferredPath)) {
                        step.put("path", inferredPath);
                    }
                }
                continue;
            }
            if ("expect_url".equals(action)) {
                ensureExpectedUiUrl(step, draft);
                continue;
            }
            if (!Set.of("fill", "click", "select", "wait_for", "expect_text", "expect_visible", "expect_hidden").contains(action)) {
                continue;
            }

            String selector = readTextField(step, "selector", "locator", "target", "field");
            boolean selectorExistsInSource = !isBlank(selector) && knownSelectors.contains(selector);
            boolean selectorBelongsToPage = selectorExistsInSource
                    && (!pageSpecificSourcesExist || sources.stream()
                    .anyMatch(source -> source.selector.equals(selector) && sourceMatchesGotoPath(source, effectiveGotoPath)));
            if (!isPlaceholderSelector(selector) && selectorBelongsToPage) {
                ensureUiStepValue(step, action, draft, findSourceBySelector(sources, selector));
                continue;
            }

            SelectorSource replacement = findBestSelectorReplacement(sources, effectiveGotoPath, action, step, pageSpecificSourcesExist);
            if (replacement != null) {
                step.put("selector", replacement.selector);
                ensureUiStepValue(step, action, draft, replacement);
            } else if (isUiAssertionAction(action)
                    && !selectorExistsInSource
                    && convertMissingSelectorAssertionToUrlExpectation(step, draft)) {
                step.remove("selector");
            }
        }

        configObject.put("type", "UI");
        // Convert ObjectNode về Map để Jackson serialize đúng khi lưu vào staging payload
        try {
            draft.setConfiguration(objectMapper.treeToValue(configObject, Object.class));
        } catch (Exception e) {
            draft.setConfiguration(configObject);
        }
    }

    private String normalizeUiAction(String action, String description) {
        String raw = action == null ? "" : action.trim().toLowerCase(Locale.ROOT);
        String details = description == null ? "" : description.trim().toLowerCase(Locale.ROOT);
        String text = (raw + " " + details).trim();
        if (text.isBlank()) return "";

        String compactAction = raw.replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        Set<String> allowedActions = Set.of(
                "goto", "fill", "click", "select", "wait_for",
                "expect_url", "expect_text", "expect_visible", "expect_hidden"
        );
        if (allowedActions.contains(compactAction)) return compactAction;

        boolean verificationIntent = containsAny(text, "verify", "expect", "assert", "check", "validate", "confirm", "should");
        if (containsAny(text, "expect_url", "assert_url")
                || (verificationIntent && containsAny(text, "url", "route", "path", "redirect", "dashboard", "home"))) {
            return "expect_url";
        }
        if (containsAny(text, "expect_hidden", "hidden", "not visible")) return "expect_hidden";
        if (containsAny(text, "expect_visible", "visible", "displayed", "shown")) return "expect_visible";
        if (containsAny(text, "expect_text", "assert_text", "verify_text")
                || (verificationIntent && containsAny(text, "text", "message", "error", "success", "toast", "alert"))) {
            return "expect_text";
        }
        if (containsAny(text, "goto", "navigate", "navigation", "go to", "open", "visit")) return "goto";
        if (containsAny(text, "fill", "input", "enter", "type", "provide")) return "fill";
        if (containsAny(text, "click", "tap", "press", "submit")) return "click";
        if (containsAny(text, "select", "choose", "pick")) return "select";
        if (containsAny(text, "wait_for", "wait", "loaded", "appear")) return "wait_for";

        return compactAction;
    }

    private boolean containsAny(String text, String... needles) {
        if (text == null || text.isBlank()) return false;
        for (String needle : needles) {
            if (needle != null && !needle.isBlank() && text.contains(needle.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private String inferRouteFromTitleOrSources(AiDraftTestCase draft, List<SelectorSource> sources) {
        String text = normalizeRouteIntent((draft.getTitle() != null ? draft.getTitle() : "") + " "
                + (draft.getPrecondition() != null ? draft.getPrecondition() : "") + " "
                + (draft.getExpectedResult() != null ? draft.getExpectedResult() : ""));
        Set<String> titleAliases = routeAliases(text);
        for (SelectorSource source : sources) {
            String sourceText = (source.formAction + " " + source.filePath + " " + source.role + " " + source.selector).trim();
            if (containsAnyRouteAlias(sourceText, titleAliases) || routeAliasesOverlap(titleAliases, routeAliases(sourceText))) {
                String route = routePathFromSource(source);
                if (!isBlank(route)) return route;
            }
        }
        return routePathFromIntent(text);
    }

    private SelectorSource findBestSelectorReplacement(List<SelectorSource> sources,
                                                       String gotoPath,
                                                       String action,
                                                       JsonNode step,
                                                       boolean requirePageMatch) {
        String stepText = (readTextField(step, "description", "selector", "value", "expected") + " " + action).toLowerCase(Locale.ROOT);
        List<String> desiredRoles = desiredRolesForStep(action, stepText);

        SelectorSource best = null;
        int bestScore = Integer.MIN_VALUE;
        for (SelectorSource source : sources) {
            boolean matchesPage = !isBlank(gotoPath) && sourceMatchesGotoPath(source, gotoPath);
            if (requirePageMatch && !matchesPage) continue;

            int pageScore = matchesPage ? 100 : 0;
            int score = pageScore;
            String role = source.role.toLowerCase(Locale.ROOT);
            String selector = source.selector.toLowerCase(Locale.ROOT);
            for (String desiredRole : desiredRoles) {
                if (role.contains(desiredRole)) score += 60;
                if (selector.contains(desiredRole.replace("_field", "").replace("_button", ""))) score += 15;
            }
            if ("click".equals(action) && (role.contains("submit") || selector.contains("button"))) score += 30;
            if (Set.of("fill", "select").contains(action) && (selector.contains("input") || selector.contains("select") || role.contains("field"))) score += 20;
            if (!isUiAssertionAction(action)) {
                if (stepText.contains("password") && role.contains("password")) score += 40;
                if ((stepText.contains("username") || stepText.contains("email") || stepText.contains("login"))
                        && (role.contains("username") || role.contains("email") || role.contains("input"))) score += 40;
            }

            if (isUiAssertionAction(action) && score <= pageScore) {
                continue;
            }

            if (score > bestScore) {
                bestScore = score;
                best = source;
            }
        }
        return bestScore > 0 ? best : null;
    }

    private List<String> desiredRolesForStep(String action, String stepText) {
        List<String> roles = new ArrayList<>();
        if ("click".equals(action)) {
            roles.add("submit");
            roles.add("button");
            return roles;
        }
        if (isUiAssertionAction(action)) {
            if (stepText.contains("success") || stepText.contains("logged in") || stepText.contains("dashboard")) {
                roles.add("success");
            }
            if (stepText.contains("error") || stepText.contains("invalid") || stepText.contains("wrong") || stepText.contains("fail")) {
                roles.add("error");
            }
            roles.add("message");
            roles.add("alert");
            roles.add("toast");
            roles.add("notification");
            return roles;
        }
        if (stepText.contains("confirm") && stepText.contains("password")) {
            roles.add("confirm_password");
        } else if (stepText.contains("password")) {
            roles.add("password");
        } else if (stepText.contains("email")) {
            roles.add("username_or_email");
            roles.add("email");
            roles.add("input");
        } else if (stepText.contains("username") || stepText.contains("user") || stepText.contains("login")) {
            roles.add("username_or_email");
            roles.add("username");
            roles.add("input");
        } else if (stepText.contains("otp") || stepText.contains("code")) {
            roles.add("otp");
            roles.add("code");
        }
        roles.add("field");
        return roles;
    }

    private boolean isUiAssertionAction(String action) {
        return Set.of("expect_text", "expect_visible", "expect_hidden").contains(action);
    }

    private SelectorSource findSourceBySelector(List<SelectorSource> sources, String selector) {
        if (sources == null || selector == null) return null;
        return sources.stream()
                .filter(source -> selector.equals(source.selector))
                .findFirst()
                .orElse(null);
    }

    private void ensureUiStepValue(com.fasterxml.jackson.databind.node.ObjectNode step,
                                   String action,
                                   AiDraftTestCase draft,
                                   SelectorSource source) {
        if (!Set.of("fill", "select").contains(action)) return;
        String value = readTextField(step, "value", "input", "text", "option");
        if (!isPlaceholderUiValue(value)) return;
        step.put("value", inferUiInputValue(step, draft, source));
    }

    private String inferUiInputValue(JsonNode step, AiDraftTestCase draft, SelectorSource source) {
        String stepDescription = readTextField(step, "description").toLowerCase(Locale.ROOT);
        String text = (
                readTextField(step, "description", "selector", "value", "expected") + " "
                        + (draft.getTitle() != null ? draft.getTitle() : "") + " "
                        + (draft.getScenarioType() != null ? draft.getScenarioType() : "") + " "
                        + (source != null ? source.role + " " + source.selector : "")
        ).toLowerCase(Locale.ROOT);
        boolean negative = text.matches(".*(invalid|wrong|fail|incorrect|negative).*");
        if (text.contains("confirm") && text.contains("password")) return negative ? "differentPassword123" : "password123";
        if (text.contains("password")) return negative ? "wrongpassword" : "password123";
        if (stepDescription.contains("username") || stepDescription.contains("user")) {
            return negative ? "invaliduser" : "testuser";
        }
        if (text.contains("email")) return negative ? "invalid-email" : "test@example.com";
        if (text.contains("username") || text.contains("user") || text.contains("login") || text.contains("input")) {
            return negative ? "invaliduser" : "testuser";
        }
        if (text.contains("otp") || text.contains("code")) return negative ? "000000" : "123456";
        return negative ? "invalid" : "sample";
    }

    private boolean convertMissingSelectorAssertionToUrlExpectation(com.fasterxml.jackson.databind.node.ObjectNode step,
                                                                    AiDraftTestCase draft) {
        String text = (
                readTextField(step, "description", "expected", "expectedText") + " "
                        + (draft.getTitle() != null ? draft.getTitle() : "") + " "
                        + (draft.getExpectedResult() != null ? draft.getExpectedResult() : "")
        ).toLowerCase(Locale.ROOT);
        String expectedUrl = inferExpectedUiUrl(text);
        if (isBlank(expectedUrl)) {
            return false;
        }
        step.put("action", "expect_url");
        step.put("expected", expectedUrl);
        return true;
    }

    private void ensureExpectedUiUrl(com.fasterxml.jackson.databind.node.ObjectNode step, AiDraftTestCase draft) {
        String expected = readTextField(step, "expected", "expectedUrl", "url", "path");
        if (!isBlank(expected) && !isPlaceholderSelector(expected) && !isPlaceholderUiValue(expected)) {
            step.put("expected", expected);
            return;
        }
        String text = (
                readTextField(step, "description", "expected", "expectedText", "expectedUrl") + " "
                        + (draft.getTitle() != null ? draft.getTitle() : "") + " "
                        + (draft.getExpectedResult() != null ? draft.getExpectedResult() : "")
        ).toLowerCase(Locale.ROOT);
        String inferred = inferExpectedUiUrl(text);
        if (!isBlank(inferred)) {
            step.put("expected", inferred);
        }
    }

    private String inferExpectedUiUrl(String text) {
        if (text == null || text.isBlank()) return "";
        String normalized = text.toLowerCase(Locale.ROOT);
        if (normalized.contains("dashboard")) return "/dashboard";
        if (normalized.contains("home")) return "/home";
        if (normalized.contains("profile")) return "/profile";
        if (normalized.contains("logged in") || normalized.contains("login success") || normalized.contains("successfully logged")) {
            return "/dashboard";
        }
        return "";
    }

    private String routePathFromSource(SelectorSource source) {
        if (source == null) return "";
        String actionRoute = cleanupRouteCandidate(source.formAction);
        if (!isBlank(actionRoute)) return actionRoute;
        return routePathFromIntent(source.filePath + " " + source.formAction);
    }

    private String cleanupRouteCandidate(String route) {
        if (route == null || route.isBlank()) return "";
        String cleaned = route.trim()
                .replaceAll("\\$\\{[^}]+}", "")
                .replaceAll("<%=?[^%]+%>", "")
                .replace("\\", "/")
                .replaceAll("^['\"]|['\"]$", "")
                .trim();
        int queryIdx = cleaned.indexOf('?');
        if (queryIdx >= 0) cleaned = cleaned.substring(0, queryIdx);
        if (cleaned.isBlank()) return "";
        if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
            try {
                String path = URI.create(cleaned).getPath();
                cleaned = path == null ? "" : path;
            } catch (Exception ignored) {
                cleaned = "";
            }
        }
        if (!cleaned.startsWith("/")) cleaned = "/" + cleaned;
        cleaned = cleaned.replaceAll("/{2,}", "/");
        return isConcreteUiRoute(cleaned) ? cleaned : routePathFromIntent(route);
    }

    private boolean isConcreteUiRoute(String route) {
        if (route == null || route.isBlank()) return false;
        String normalized = route.trim().toLowerCase(Locale.ROOT);
        return !normalized.contains("{")
                && !normalized.contains("}")
                && !normalized.contains("<")
                && !normalized.contains(">")
                && !normalized.contains("copy_")
                && !normalized.contains("e.g.");
    }

    private String routePathFromIntent(String text) {
        if (text == null || text.isBlank()) return "";
        String compact = normalizeRouteIntent(text).replace(" ", "");
        if (compact.contains("login") || compact.contains("signin")) return "/login";
        if (compact.contains("register") || compact.contains("signup")) return "/register";
        if (compact.contains("forgot") || compact.contains("forget") || compact.contains("resetpassword")) return "/reset-password";
        if (compact.contains("reset") || compact.contains("password")) return "/reset-password";
        if (compact.contains("otp") || compact.contains("verify") || compact.contains("verification")) return "/verify";
        if (compact.contains("profile") || compact.contains("account") || compact.contains("setting")) return "/profile";
        return "";
    }

    private <T> T parseJsonObject(String rawJson, TypeReference<T> typeRef) {
        try {
            String cleanJson = rawJson.trim();

            // Strip ```json ... ``` or ``` ... ``` fences (with or without newline after opening fence)
            if (cleanJson.startsWith("```")) {
                // Remove opening fence: ```json or ```
                int newlineIdx = cleanJson.indexOf('\n');
                if (newlineIdx != -1) {
                    cleanJson = cleanJson.substring(newlineIdx + 1).trim();
                } else {
                    // No newline after fence — strip the fence prefix manually
                    cleanJson = cleanJson.replaceFirst("^```(json)?", "").trim();
                }
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3).trim();
            }

            int firstCurly = cleanJson.indexOf("{");
            int lastCurly = cleanJson.lastIndexOf("}");
            int firstSquare = cleanJson.indexOf("[");
            int lastSquare = cleanJson.lastIndexOf("]");

            if (firstCurly != -1 && lastCurly > firstCurly) {
                if (firstSquare != -1 && lastSquare > firstSquare) {
                    if (firstCurly < firstSquare && lastCurly > lastSquare) {
                        cleanJson = cleanJson.substring(firstCurly, lastCurly + 1);
                    } else if (firstSquare < firstCurly && lastSquare > lastCurly) {
                        cleanJson = cleanJson.substring(firstSquare, lastSquare + 1);
                    } else {
                        if (firstCurly < firstSquare) cleanJson = cleanJson.substring(firstCurly, lastCurly + 1);
                        else cleanJson = cleanJson.substring(firstSquare, lastSquare + 1);
                    }
                } else {
                    cleanJson = cleanJson.substring(firstCurly, lastCurly + 1);
                }
            } else if (firstSquare != -1 && lastSquare > firstSquare) {
                cleanJson = cleanJson.substring(firstSquare, lastSquare + 1);
            }

            // Sanitize control characters inside JSON string values.
            // Some providers (e.g. Groq) embed raw newlines/tabs in string values,
            // which is illegal per JSON spec and causes Jackson to throw:
            // "Illegal unquoted character (CTRL-CHAR, code 10)"
            cleanJson = sanitizeJsonTemplateLiteralValues(cleanJson);
            cleanJson = sanitizeJsonControlChars(cleanJson);

            return objectMapper.copy()
                    .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_ENUMS, true)
                    .configure(JsonReadFeature.ALLOW_JAVA_COMMENTS.mappedFeature(), true)
                    .configure(JsonReadFeature.ALLOW_SINGLE_QUOTES.mappedFeature(), true)
                    .configure(JsonReadFeature.ALLOW_TRAILING_COMMA.mappedFeature(), true)
                    .configure(JsonReadFeature.ALLOW_UNQUOTED_FIELD_NAMES.mappedFeature(), true)
                    .readValue(cleanJson, typeRef);
        } catch (Exception e) {
            log.error("Failed to parse JSON from AI (exception: {}): \n{}", e.getMessage(), rawJson);
            throw new BusinessException("Không thể parse kết quả từ AI. Định dạng lỗi.");
        }
    }

    private String sanitizeJsonTemplateLiteralValues(String json) {
        if (json == null || json.indexOf('`') < 0) return json;

        StringBuilder sb = new StringBuilder(json.length());
        boolean inString = false;
        boolean escaped = false;
        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);

            if (escaped) {
                sb.append(c);
                escaped = false;
                continue;
            }
            if (inString && c == '\\') {
                sb.append(c);
                escaped = true;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                sb.append(c);
                continue;
            }
            if (!inString && c == '`') {
                int end = findTemplateLiteralEnd(json, i + 1);
                if (end > i) {
                    String value = json.substring(i + 1, end);
                    try {
                        sb.append(objectMapper.writeValueAsString(value));
                    } catch (JsonProcessingException e) {
                        sb.append('"').append(value.replace("\\", "\\\\").replace("\"", "\\\"")).append('"');
                    }
                    i = end;
                    continue;
                }
            }
            sb.append(c);
        }
        return sb.toString();
    }

    private int findTemplateLiteralEnd(String json, int start) {
        boolean escaped = false;
        for (int i = start; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (c == '\\') {
                escaped = true;
                continue;
            }
            if (c == '`') {
                return i;
            }
        }
        return -1;
    }

    private void validateGeneratedDrafts(List<AiDraftTestCase> drafts,
                                         Requirement req,
                                         List<UseCase> useCases,
                                         String selectorContext,
                                         String apiKnowledgeContext,
                                         Long projectId) {
        if (drafts == null || drafts.isEmpty()) return;

        Set<String> allowedSelectors = extractSelectorsFromContext(selectorContext);
        List<ApiEndpointSpec> apiEndpoints = extractApiEndpoints(apiKnowledgeContext);
        Set<String> knownAcIds = extractAcceptanceCriterionIds(req != null ? req.getAcceptanceCriteria() : null);
        Set<String> existingTitles = loadExistingTestCaseTitles(req, projectId);
        Map<String, Long> batchTitleCounts = drafts.stream()
                .filter(Objects::nonNull)
                .map(AiDraftTestCase::getTitle)
                .filter(Objects::nonNull)
                .map(this::normalizeTitle)
                .filter(s -> !s.isBlank())
                .collect(Collectors.groupingBy(s -> s, LinkedHashMap::new, Collectors.counting()));

        for (AiDraftTestCase draft : drafts) {
            if (draft == null) {
                continue;
            }
            ValidationBucket bucket = new ValidationBucket();
            validateCommonDraftFields(draft, req, knownAcIds, useCases, existingTitles, batchTitleCounts, bucket);
            if (draft.getScenarioType() == null || draft.getScenarioType().isBlank()) {
                draft.setScenarioType(inferScenarioType(draft));
            }

            TestType type = draft.getType();
            if (type == TestType.UI) {
                validateUiDraft(draft, selectorContext, allowedSelectors, bucket);
            } else if (type == TestType.API) {
                validateApiDraft(draft, apiKnowledgeContext, apiEndpoints, bucket);
            } else if (type == TestType.MANUAL) {
                validateManualDraft(draft, bucket);
            }

            applySourceGrounding(draft, req, useCases, selectorContext, apiKnowledgeContext);
            draft.setValidationMessages(bucket.messages);
            draft.setValidationStatus(bucket.errors > 0 ? "INVALID" : (bucket.warnings > 0 ? "WARNING" : "VALID"));
        }
    }

    private void validateCommonDraftFields(AiDraftTestCase draft,
                                           Requirement req,
                                           Set<String> knownAcIds,
                                           List<UseCase> useCases,
                                           Set<String> existingTitles,
                                           Map<String, Long> batchTitleCounts,
                                           ValidationBucket bucket) {
        if (isBlank(draft.getTitle())) {
            bucket.error("Title is required.");
        } else {
            if (draft.getTitle().trim().length() > 200) {
                bucket.error("Title must not exceed 200 characters.");
            }
            String normalizedTitle = normalizeTitle(draft.getTitle());
            if (existingTitles.contains(normalizedTitle)) {
                bucket.warn("A saved test case already has the same title.");
            }
            if (batchTitleCounts.getOrDefault(normalizedTitle, 0L) > 1) {
                bucket.warn("Another AI draft in this batch has the same title.");
            }
        }

        if (draft.getType() == null) {
            draft.setType(TestType.MANUAL);
            bucket.warn("AI omitted test type; defaulted to MANUAL.");
        }

        if (req != null) {
            if (draft.getRequirementId() == null) {
                draft.setRequirementId(req.getId());
            } else if (!draft.getRequirementId().equals(req.getId())) {
                bucket.error("Requirement ID does not match the selected requirement.");
                draft.setRequirementId(req.getId());
            }
        } else if (draft.getRequirementId() == null) {
            bucket.error("Requirement ID is required.");
        }

        if (isBlank(draft.getExpectedResult())) {
            bucket.error("Expected result is required.");
        }
        if (draft.getSteps() == null || draft.getSteps().isEmpty()) {
            bucket.error("At least one human-readable test step is required.");
        } else {
            for (int i = 0; i < draft.getSteps().size(); i++) {
                TestStepRequest step = draft.getSteps().get(i);
                if (step == null || isBlank(step.getDescription())) {
                    bucket.error("Step " + (i + 1) + " description is required.");
                }
            }
        }

        if (!knownAcIds.isEmpty()) {
            List<String> coveredAcs = draft.getCoveredAcceptanceCriteria();
            if (coveredAcs == null || coveredAcs.isEmpty()) {
                bucket.warn("No covered acceptance criteria were declared.");
            } else {
                Set<String> normalizedKnown = knownAcIds.stream()
                        .map(s -> s.toUpperCase(Locale.ROOT))
                        .collect(Collectors.toSet());
                for (String ac : coveredAcs) {
                    if (ac != null && !normalizedKnown.contains(ac.trim().toUpperCase(Locale.ROOT))) {
                        bucket.warn("Covered acceptance criterion '" + ac + "' was not found in the selected requirement.");
                    }
                }
            }
        }

        if (useCases != null && !useCases.isEmpty()
                && (draft.getCoveredUseCases() == null || draft.getCoveredUseCases().isEmpty())) {
            bucket.warn("No linked use case coverage was declared.");
        }
    }

    private void validateUiDraft(AiDraftTestCase draft,
                                 String selectorContext,
                                 Set<String> allowedSelectors,
                                 ValidationBucket bucket) {
        JsonNode config = objectMapper.valueToTree(draft.getConfiguration());
        JsonNode configSteps = config.path("steps");

        if (config.isMissingNode() || config.isNull() || !config.isObject()) {
            bucket.error("UI configuration is required and must be an object.");
            return;
        }
        if (!configSteps.isArray() || configSteps.isEmpty()) {
            bucket.error("UI configuration must include executable steps.");
        }

        Set<String> allowedActions = Set.of(
                "goto", "fill", "click", "select", "wait_for",
                "expect_url", "expect_text", "expect_visible", "expect_hidden"
        );
        if (configSteps.isArray()) {
            for (int i = 0; i < configSteps.size(); i++) {
                JsonNode step = configSteps.get(i);
                if (step == null || !step.isObject()) {
                    bucket.error("UI executable step " + (i + 1) + " must be an object.");
                    continue;
                }

                com.fasterxml.jackson.databind.node.ObjectNode stepObject = (com.fasterxml.jackson.databind.node.ObjectNode) step;
                String action = normalizeUiAction(
                        readTextField(stepObject, "action", "type", "command"),
                        readTextField(stepObject, "description", "title")
                );
                if (action.isBlank()) {
                    bucket.error("UI executable step " + (i + 1) + " is missing action.");
                    continue;
                }
                stepObject.put("action", action);
                if (!allowedActions.contains(action)) {
                    bucket.error("UI action '" + action + "' is not in the supported action list.");
                    continue;
                }

                boolean needsSelector = Set.of("fill", "click", "select", "wait_for", "expect_text", "expect_visible", "expect_hidden").contains(action);
                String selector = readTextField(step, "selector", "locator", "target", "field");
                if (needsSelector) {
                    if (isBlank(selector)) {
                        bucket.error("UI executable step " + (i + 1) + " requires a selector.");
                    } else if (isPlaceholderSelector(selector)) {
                        bucket.error("UI executable step " + (i + 1) + " uses a placeholder selector instead of a real source selector.");
                    }
                }
                if ("goto".equals(action)) {
                    String path = readTextField(step, "path", "url", "href");
                    if (isBlank(path)) {
                        bucket.error("UI executable step " + (i + 1) + " requires a path.");
                    } else if (isPlaceholderSelector(path)) {
                        bucket.error("UI executable step " + (i + 1) + " uses a placeholder path instead of a real route.");
                    }
                }
                if (Set.of("fill", "select").contains(action)) {
                    String value = readTextField(step, "value", "input", "text", "option");
                    if (isPlaceholderUiValue(value)) {
                        bucket.error("UI executable step " + (i + 1) + " requires a real input value.");
                    }
                }
                if (Set.of("expect_url", "expect_text").contains(action)) {
                    String expected = readTextField(step, "expected", "expectedText", "expectedUrl");
                    if (isBlank(expected) || isPlaceholderSelector(expected) || isPlaceholderUiValue(expected)) {
                    bucket.error("UI executable step " + (i + 1) + " requires an expected value.");
                    }
                }
            }
        }

        List<String> selectors = new ArrayList<>();
        collectStringFields(config, "selector", selectors);
        boolean hasSelectorContext = selectorContext != null && !selectorContext.isBlank();
        List<SelectorSource> selectorSources = parseSelectorSources(selectorContext);
        String gotoPath = firstGotoPath(configSteps);
        if (hasSelectorContext && selectors.isEmpty()) {
            bucket.warn("Source selectors were available, but this UI test case does not use any selector.");
        }
        if (hasSelectorContext && !allowedSelectors.isEmpty()) {
            for (String selector : selectors) {
                if (!allowedSelectors.contains(selector)) {
                    bucket.error("Selector '" + selector + "' was not found in scanned source code.");
                }
            }
        }
        if (hasSelectorContext && !selectorSources.isEmpty() && !isBlank(gotoPath)) {
            boolean hasAnyPageSpecificSource = selectorSources.stream()
                    .anyMatch(source -> sourceMatchesGotoPath(source, gotoPath));
            if (hasAnyPageSpecificSource) {
                for (String selector : selectors) {
                    if (isPlaceholderSelector(selector)) {
                        continue;
                    }
                    boolean belongsToGotoPage = selectorSources.stream()
                            .anyMatch(source -> source.selector.equals(selector) && sourceMatchesGotoPath(source, gotoPath));
                    if (!belongsToGotoPage) {
                        bucket.error("Selector '" + selector + "' belongs to a different source form/file than goto path '" + gotoPath + "'. Do not mix login/register/reset selectors.");
                    }
                }
            } else {
                bucket.warn("Source selectors were available, but no scanned form/file matched goto path '" + gotoPath + "'.");
            }
        }

        if (configSteps.isArray() && !configSteps.isEmpty()) {
            JsonNode lastStep = configSteps.get(configSteps.size() - 1);
            String action = normalizeUiAction(
                    readTextField(lastStep, "action", "type", "command"),
                    readTextField(lastStep, "description", "title")
            );
            boolean hasAssertionLikeField = lastStep.has("assertion") || lastStep.has("expected") || lastStep.has("expectedText");
            if (!action.startsWith("expect_") && !hasAssertionLikeField) {
                bucket.warn("Final UI executable step should verify the expected result.");
            }
        } else if (draft.getSteps() != null && !draft.getSteps().isEmpty()) {
            String lastDescription = draft.getSteps().get(draft.getSteps().size() - 1).getDescription();
            if (lastDescription == null || !lastDescription.toLowerCase(Locale.ROOT).matches(".*(verify|assert|expect|check|confirm).*")) {
                bucket.warn("Final human-readable step should be a verification step.");
            }
        }
    }

    private void validateApiDraft(AiDraftTestCase draft,
                                  String apiKnowledgeContext,
                                  List<ApiEndpointSpec> apiEndpoints,
                                  ValidationBucket bucket) {
        JsonNode config = objectMapper.valueToTree(draft.getConfiguration());
        if (config.isMissingNode() || config.isNull() || !config.isObject()) {
            bucket.error("API configuration is required.");
            return;
        }

        String method = config.path("apiMethod").asText("").trim().toUpperCase(Locale.ROOT);
        String url = firstNonBlank(config.path("apiUrl").asText(null), config.path("apiEndpoint").asText(null));
        if (method.isBlank()) {
            bucket.error("API method is required.");
        } else if (!Set.of("GET", "POST", "PUT", "PATCH", "DELETE").contains(method)) {
            bucket.error("API method must be one of GET, POST, PUT, PATCH, DELETE.");
        }
        if (isBlank(url)) {
            bucket.error("API URL is required.");
        }

        ApiEndpointSpec matchedEndpoint = null;
        boolean hasRawApiKnowledge = apiKnowledgeContext != null && !apiKnowledgeContext.isBlank();
        boolean hasApiKnowledge = hasRawApiKnowledge && !apiEndpoints.isEmpty();
        if (hasRawApiKnowledge && apiEndpoints.isEmpty()) {
            bucket.warn("API source context was available but could not be parsed for validation.");
        }
        if (hasApiKnowledge && !isBlank(url)) {
            String path = extractApiPath(url);
            matchedEndpoint = findEndpoint(apiEndpoints, method, path);
            if (matchedEndpoint == null) {
                ApiEndpointSpec pathOnly = findEndpointByPath(apiEndpoints, path);
                if (pathOnly != null) {
                    bucket.error("API method '" + method + "' does not match scanned endpoint method '" + pathOnly.method + "'.");
                } else {
                    bucket.error("API endpoint '" + path + "' was not found in scanned backend source code.");
                }
            }
        }

        JsonNode headers = config.path("apiHeaders");
        if (!headers.isObject()) {
            bucket.warn("API headers should be a JSON object.");
        } else if (matchedEndpoint != null && matchedEndpoint.requiresAuth
                && isBlank(firstNonBlank(headers.path("Authorization").asText(null), headers.path("authorization").asText(null)))) {
            bucket.warn("Endpoint requires authentication, but Authorization header is missing.");
        }

        JsonNode assertions = config.has("apiAssertions") ? config.get("apiAssertions") : config.path("assertions");
        List<Integer> assertedStatuses = extractAssertedStatusCodes(assertions);
        if (!assertions.isArray()) {
            bucket.error("API assertions must be an array.");
        }
        if (assertedStatuses.isEmpty()) {
            bucket.error("API test case must include at least one STATUS_CODE assertion.");
        } else if (matchedEndpoint != null && !matchedEndpoint.expectedStatuses.isEmpty()) {
            Set<Integer> commonErrorStatuses = Set.of(400, 401, 403, 404, 409, 422, 500);
            for (Integer status : assertedStatuses) {
                if (!matchedEndpoint.expectedStatuses.contains(status) && !commonErrorStatuses.contains(status)) {
                    bucket.warn("Asserted status " + status + " is not listed for the scanned endpoint.");
                }
            }
        }

        JsonNode body = config.has("apiBody") ? config.get("apiBody") : objectMapper.createObjectNode();
        boolean bodyIsObject = body != null && body.isObject();
        if (!config.has("apiBody")) {
            bucket.warn("API configuration should include apiBody; use {} when the endpoint has no request body.");
        } else if (!bodyIsObject) {
            bucket.warn("API body should be a JSON object.");
        }

        if (matchedEndpoint != null) {
            Set<String> knownFields = matchedEndpoint.fields.keySet();
            if (bodyIsObject) {
                body.fieldNames().forEachRemaining(field -> {
                    if (!knownFields.isEmpty() && !knownFields.contains(field)) {
                        bucket.warn("Request body field '" + field + "' was not found in the scanned DTO.");
                    }
                });
            }

            boolean positiveScenario = "positive".equalsIgnoreCase(draft.getScenarioType())
                    || (draft.getTitle() != null && draft.getTitle().toLowerCase(Locale.ROOT).matches(".*(success|valid|happy).*"));
            if (positiveScenario) {
                for (ApiFieldSpec field : matchedEndpoint.fields.values()) {
                    if (field.required && (!bodyIsObject || !body.has(field.name))) {
                        bucket.warn("Positive API case is missing required body field '" + field.name + "'.");
                    }
                }
            }
        }
    }

    private void validateManualDraft(AiDraftTestCase draft, ValidationBucket bucket) {
        if (isBlank(draft.getPrecondition())) {
            bucket.warn("Manual test case should describe a clear precondition.");
        }
    }

    private void applySourceGrounding(AiDraftTestCase draft,
                                      Requirement req,
                                      List<UseCase> useCases,
                                      String selectorContext,
                                      String apiKnowledgeContext) {
        Set<String> grounding = new java.util.LinkedHashSet<>();
        if (req != null) grounding.add("REQUIREMENT");
        if (useCases != null && !useCases.isEmpty()) grounding.add("USE_CASE");
        if (draft.getType() == TestType.UI && selectorContext != null && !selectorContext.isBlank()) grounding.add("SELECTOR");
        if (draft.getType() == TestType.API && apiKnowledgeContext != null && !apiKnowledgeContext.isBlank()) grounding.add("API");

        if (draft.getSourceGrounding() == null || draft.getSourceGrounding().isEmpty()) {
            draft.setSourceGrounding(new ArrayList<>(grounding));
        } else {
            java.util.LinkedHashSet<String> merged = new java.util.LinkedHashSet<>();
            for (String item : draft.getSourceGrounding()) {
                if (item != null && !item.isBlank()) merged.add(item.trim().toUpperCase(Locale.ROOT));
            }
            merged.addAll(grounding);
            draft.setSourceGrounding(new ArrayList<>(merged));
        }
    }

    private Set<String> extractSelectorsFromContext(String selectorContext) {
        Set<String> selectors = new HashSet<>();
        if (selectorContext == null || selectorContext.isBlank()) return selectors;

        Pattern p = Pattern.compile("SELECTOR \\([^)]*\\):\\s*(.+)");
        for (String line : selectorContext.split("\\R")) {
            Matcher m = p.matcher(line.trim());
            if (m.find()) {
                String selector = m.group(1).trim();
                if (!selector.isBlank()) selectors.add(selector);
            }
        }
        return selectors;
    }

    private List<SelectorSource> parseSelectorSources(String selectorContext) {
        List<SelectorSource> sources = new ArrayList<>();
        if (selectorContext == null || selectorContext.isBlank()) return sources;

        Pattern filePattern = Pattern.compile("^FILE:\\s*(.+)$");
        Pattern formPattern = Pattern.compile("^\\s*FORM(?:\\s+action=\"([^\"]*)\")?.*$");
        Pattern rolePattern = Pattern.compile("^\\s*\\[([^\\]]+)]\\s+.*$");
        Pattern selectorPattern = Pattern.compile("^\\s*SELECTOR \\([^)]*\\):\\s*(.+)$");

        String currentFile = "";
        String currentFormAction = "";
        String currentRole = "";
        for (String rawLine : selectorContext.split("\\R")) {
            String line = rawLine == null ? "" : rawLine;

            Matcher fileMatcher = filePattern.matcher(line.trim());
            if (fileMatcher.find()) {
                currentFile = fileMatcher.group(1).trim();
                currentFormAction = "";
                currentRole = "";
                continue;
            }

            Matcher formMatcher = formPattern.matcher(line);
            if (formMatcher.find() && line.trim().startsWith("FORM")) {
                currentFormAction = formMatcher.group(1) != null ? formMatcher.group(1).trim() : "";
                currentRole = "";
                continue;
            }

            Matcher roleMatcher = rolePattern.matcher(line);
            if (roleMatcher.find()) {
                currentRole = roleMatcher.group(1).trim();
                continue;
            }

            Matcher selectorMatcher = selectorPattern.matcher(line);
            if (selectorMatcher.find()) {
                String selector = selectorMatcher.group(1).trim();
                if (!selector.isBlank()) {
                    sources.add(new SelectorSource(selector, currentFile, currentFormAction, currentRole));
                }
            }
        }
        return sources;
    }

    private String firstGotoPath(JsonNode configSteps) {
        if (configSteps == null || !configSteps.isArray()) return "";
        for (JsonNode step : configSteps) {
            if (step == null || !step.isObject()) continue;
            String action = normalizeUiAction(
                    readTextField(step, "action", "type", "command"),
                    readTextField(step, "description", "title")
            );
            if ("goto".equals(action)) {
                return readTextField(step, "path", "url", "href");
            }
        }
        return "";
    }

    private boolean sourceMatchesGotoPath(SelectorSource source, String gotoPath) {
        if (source == null || isBlank(gotoPath)) return false;
        Set<String> aliases = routeAliases(gotoPath);
        if (aliases.isEmpty()) return false;

        String sourceText = (source.formAction + " " + source.filePath + " " + source.role + " " + source.selector).trim();
        if (containsAnyRouteAlias(sourceText, aliases)) {
            return true;
        }

        if (routeAliasesOverlap(aliases, routeAliases(sourceText))) {
            return true;
        }

        String normalizedGoto = normalizeRouteIntent(gotoPath);
        String normalizedSource = normalizeRouteIntent(sourceText);
        return routeIntentMatches(normalizedGoto, normalizedSource);
    }

    private Set<String> routeAliases(String pathOrUrl) {
        String normalized = normalizeRouteIntent(pathOrUrl);
        if (normalized.isBlank()) return Set.of();

        java.util.LinkedHashSet<String> aliases = new java.util.LinkedHashSet<>();
        for (String token : normalized.split("\\s+")) {
            if (token.length() > 1 && !Set.of("api", "v1", "view", "page", "auth").contains(token)) {
                aliases.add(token);
            }
        }

        String compact = normalized.replace(" ", "");
        if (compact.contains("login") || compact.contains("signin")) {
            aliases.add("login");
            aliases.add("signin");
        }
        if (compact.contains("register") || compact.contains("signup")) {
            aliases.add("register");
            aliases.add("signup");
        }
        if (compact.contains("forgot") || compact.contains("forget") || compact.contains("reset") || compact.contains("password")) {
            aliases.add("forgot");
            aliases.add("forget");
            aliases.add("reset");
            aliases.add("password");
        }
        if (compact.contains("otp") || compact.contains("verify") || compact.contains("verification")) {
            aliases.add("otp");
            aliases.add("verify");
            aliases.add("verification");
        }
        if (compact.contains("profile") || compact.contains("account") || compact.contains("setting")) {
            aliases.add("profile");
            aliases.add("account");
            aliases.add("setting");
        }
        return aliases;
    }

    private boolean containsAnyRouteAlias(String source, Set<String> aliases) {
        String normalized = normalizeRouteIntent(source);
        if (normalized.isBlank()) return false;
        String padded = " " + normalized + " ";
        String compact = normalized.replace(" ", "");
        for (String alias : aliases) {
            String cleanAlias = normalizeRouteIntent(alias);
            if (cleanAlias.isBlank()) continue;
            if (padded.contains(" " + cleanAlias + " ") || compact.contains(cleanAlias.replace(" ", ""))) {
                return true;
            }
        }
        return false;
    }

    private boolean routeAliasesOverlap(Set<String> left, Set<String> right) {
        if (left == null || left.isEmpty() || right == null || right.isEmpty()) return false;
        for (String alias : left) {
            if (right.contains(alias)) {
                return true;
            }
        }
        return false;
    }

    private boolean routeIntentMatches(String normalizedGoto, String normalizedSource) {
        if (normalizedGoto.isBlank() || normalizedSource.isBlank()) return false;
        String gotoCompact = normalizedGoto.replace(" ", "");
        String sourceCompact = normalizedSource.replace(" ", "");
        if (sourceCompact.contains(gotoCompact) || gotoCompact.contains(sourceCompact)) {
            return true;
        }
        if ((gotoCompact.contains("login") || gotoCompact.contains("signin"))
                && (sourceCompact.contains("login") || sourceCompact.contains("signin"))) {
            return true;
        }
        if ((gotoCompact.contains("register") || gotoCompact.contains("signup"))
                && (sourceCompact.contains("register") || sourceCompact.contains("signup"))) {
            return true;
        }
        return (gotoCompact.contains("forgot") || gotoCompact.contains("reset") || gotoCompact.contains("password"))
                && (sourceCompact.contains("forgot") || sourceCompact.contains("reset") || sourceCompact.contains("password"));
    }

    private String normalizeRouteIntent(String value) {
        if (value == null) return "";
        String text = value.trim().toLowerCase(Locale.ROOT);
        int queryIdx = text.indexOf('?');
        if (queryIdx >= 0) text = text.substring(0, queryIdx);
        try {
            if (text.startsWith("http://") || text.startsWith("https://")) {
                String path = URI.create(text).getPath();
                text = path == null ? "" : path;
            }
        } catch (Exception ignored) {
            // Fall back to plain text normalization.
        }
        return text.replaceAll("[^a-z0-9]+", " ").trim();
    }

    private List<ApiEndpointSpec> extractApiEndpoints(String apiKnowledgeContext) {
        List<ApiEndpointSpec> endpoints = new ArrayList<>();
        if (apiKnowledgeContext == null || apiKnowledgeContext.isBlank()) return endpoints;

        Pattern endpointPattern = Pattern.compile("^ENDPOINT\\s+\\d+:\\s+(GET|POST|PUT|DELETE|PATCH)\\s+(\\S+)", Pattern.CASE_INSENSITIVE);
        Pattern fieldPattern = Pattern.compile("^\\s{4}([A-Za-z0-9_.$-]+)\\s+\\(([^,]+),\\s*(required|optional)\\)", Pattern.CASE_INSENSITIVE);
        Pattern statusPattern = Pattern.compile("\\d{3}");

        ApiEndpointSpec current = null;
        boolean inRequestBody = false;
        for (String rawLine : apiKnowledgeContext.split("\\R")) {
            String line = rawLine == null ? "" : rawLine;
            Matcher endpointMatcher = endpointPattern.matcher(line.trim());
            if (endpointMatcher.find()) {
                current = new ApiEndpointSpec(endpointMatcher.group(1).toUpperCase(Locale.ROOT), endpointMatcher.group(2).trim());
                endpoints.add(current);
                inRequestBody = false;
                continue;
            }
            if (current == null) continue;

            String trimmed = line.trim();
            if (trimmed.startsWith("Request Body:")) {
                inRequestBody = true;
                continue;
            }
            if (trimmed.startsWith("Path Variables:")
                    || trimmed.startsWith("Query Params:")
                    || trimmed.startsWith("Expected Status:")
                    || trimmed.startsWith("Auth:")
                    || trimmed.startsWith("Controller:")
                    || trimmed.startsWith("Description:")) {
                if (!trimmed.startsWith("Expected Status:")) {
                    inRequestBody = false;
                }
            }
            if (trimmed.startsWith("Auth:")) {
                current.requiresAuth = trimmed.toLowerCase(Locale.ROOT).startsWith("auth: required");
            }
            if (trimmed.startsWith("Expected Status:")) {
                Matcher statusMatcher = statusPattern.matcher(trimmed);
                while (statusMatcher.find()) {
                    current.expectedStatuses.add(Integer.parseInt(statusMatcher.group()));
                }
            }
            if (inRequestBody) {
                Matcher fieldMatcher = fieldPattern.matcher(line);
                if (fieldMatcher.find()) {
                    ApiFieldSpec field = new ApiFieldSpec(
                            fieldMatcher.group(1),
                            fieldMatcher.group(2),
                            "required".equalsIgnoreCase(fieldMatcher.group(3))
                    );
                    current.fields.put(field.name, field);
                }
            }
        }
        return endpoints;
    }

    private Set<String> extractAcceptanceCriterionIds(String acJson) {
        Set<String> ids = new HashSet<>();
        if (acJson == null || acJson.trim().isEmpty() || "[]".equals(acJson.trim())) return ids;
        try {
            JsonNode root = objectMapper.readTree(acJson);
            if (root.isArray()) {
                int index = 1;
                for (JsonNode ignored : root) {
                    ids.add("AC-" + index++);
                }
            } else {
                ids.add("AC-1");
            }
        } catch (Exception ignored) {
            ids.add("AC-1");
        }
        return ids;
    }

    private Set<String> loadExistingTestCaseTitles(Requirement req, Long projectId) {
        if (req == null) return Set.of();
        Long actualProjectId = projectId;
        if (actualProjectId == null && req.getProject() != null) {
            actualProjectId = req.getProject().getId();
        }
        if (actualProjectId == null) return Set.of();
        try {
            return testCaseRepository.findByRequirementIdAndProjectId(req.getId(), actualProjectId).stream()
                    .map(org.example.backend.entity.TestCase::getTitle)
                    .filter(Objects::nonNull)
                    .map(this::normalizeTitle)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            log.warn("Failed to load existing test case titles for validation: {}", e.getMessage());
            return Set.of();
        }
    }

    private List<Integer> extractAssertedStatusCodes(JsonNode assertions) {
        List<Integer> statuses = new ArrayList<>();
        if (assertions == null || !assertions.isArray()) return statuses;
        for (JsonNode assertion : assertions) {
            String type = assertion.path("type").asText("").trim().toUpperCase(Locale.ROOT);
            if (!"STATUS_CODE".equals(type)) continue;
            String expected = assertion.path("expectedValue").asText(assertion.path("expected").asText(""));
            try {
                statuses.add(Integer.parseInt(expected));
            } catch (NumberFormatException ignored) {
                // Missing valid status assertions are handled by the caller.
            }
        }
        return statuses;
    }

    private ApiEndpointSpec findEndpoint(List<ApiEndpointSpec> endpoints, String method, String path) {
        if (path == null || path.isBlank()) return null;
        return endpoints.stream()
                .filter(ep -> ep.method.equalsIgnoreCase(method))
                .filter(ep -> pathsCompatible(ep.path, path))
                .findFirst()
                .orElse(null);
    }

    private ApiEndpointSpec findEndpointByPath(List<ApiEndpointSpec> endpoints, String path) {
        if (path == null || path.isBlank()) return null;
        return endpoints.stream()
                .filter(ep -> pathsCompatible(ep.path, path))
                .findFirst()
                .orElse(null);
    }

    private ApiEndpointSpec findEndpointByDraftIntent(List<ApiEndpointSpec> endpoints, AiDraftTestCase draft, String method) {
        if (endpoints == null || endpoints.isEmpty() || draft == null) return null;
        String text = normalizeRouteIntent(buildDraftSearchText(draft, null));
        if (text.isBlank()) return null;

        ApiEndpointSpec best = null;
        int bestScore = 0;
        for (ApiEndpointSpec endpoint : endpoints) {
            if (!isBlank(method) && !endpoint.method.equalsIgnoreCase(method)) {
                continue;
            }

            int score = 0;
            Set<String> aliases = routeAliases(endpoint.path);
            for (String alias : aliases) {
                String normalizedAlias = normalizeRouteIntent(alias);
                if (!normalizedAlias.isBlank() && containsAnyRouteAlias(text, Set.of(normalizedAlias))) {
                    score += 20;
                }
            }

            String pathIntent = normalizeRouteIntent(endpoint.path);
            for (String token : pathIntent.split("\\s+")) {
                if (token.length() > 2 && !Set.of("api", "v1", "auth").contains(token) && text.contains(token)) {
                    score += 10;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                best = endpoint;
            }
        }
        return bestScore > 0 ? best : null;
    }

    private boolean pathsCompatible(String template, String actual) {
        if (template == null || actual == null) return false;
        String cleanTemplate = stripQuery(template);
        String cleanActual = stripQuery(actual);
        if (cleanTemplate.equals(cleanActual)) return true;

        String[] templateParts = cleanTemplate.split("/");
        String[] actualParts = cleanActual.split("/");
        if (templateParts.length != actualParts.length) return false;
        for (int i = 0; i < templateParts.length; i++) {
            String tp = templateParts[i];
            String ap = actualParts[i];
            if (tp.isBlank() && ap.isBlank()) continue;
            if (tp.startsWith("{") && tp.endsWith("}")) continue;
            if (!tp.equals(ap)) return false;
        }
        return true;
    }

    private String extractApiPath(String url) {
        if (url == null) return "";
        String trimmed = url.trim();
        if (trimmed.isBlank()) return "";
        try {
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                String path = URI.create(trimmed).getPath();
                return path == null || path.isBlank() ? "/" : path;
            }
        } catch (Exception ignored) {
            // Fall back to string parsing below.
        }
        int queryIdx = trimmed.indexOf('?');
        if (queryIdx >= 0) trimmed = trimmed.substring(0, queryIdx);
        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    }

    private void collectStringFields(JsonNode node, String fieldName, List<String> values) {
        if (node == null || node.isMissingNode() || node.isNull()) return;
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                if (fieldName.equals(entry.getKey()) && entry.getValue().isTextual()) {
                    values.add(entry.getValue().asText());
                }
                collectStringFields(entry.getValue(), fieldName, values);
            });
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                collectStringFields(child, fieldName, values);
            }
        }
    }

    private String inferScenarioType(AiDraftTestCase draft) {
        String text = ((draft.getTitle() != null ? draft.getTitle() : "") + " "
                + (draft.getExpectedResult() != null ? draft.getExpectedResult() : "")).toLowerCase(Locale.ROOT);
        if (text.matches(".*(security|sql injection|xss|csrf|idor|unauthorized|forbidden).*")) return "security";
        if (text.matches(".*(boundary|max|min|limit|length|out.of.range).*")) return "boundary";
        if (text.matches(".*(invalid|missing|required|empty|null|wrong|fail|error).*")) return "negative";
        if (text.matches(".*(validation|format|email|pattern).*")) return "validation";
        return "positive";
    }

    private String firstNonBlank(String first, String second) {
        return !isBlank(first) ? first : second;
    }

    private String readTextField(JsonNode node, String... fieldNames) {
        if (node == null || !node.isObject()) return "";
        for (String fieldName : fieldNames) {
            JsonNode value = node.get(fieldName);
            if (value == null || value.isNull()) continue;
            String text = value.isTextual() ? value.asText() : value.toString();
            if (!isBlank(text)) return text.trim();
        }
        return "";
    }

    private String stripQuery(String value) {
        if (value == null) return "";
        String cleanValue = value.trim();
        int queryIdx = cleanValue.indexOf('?');
        String path = queryIdx >= 0 ? cleanValue.substring(0, queryIdx) : cleanValue;
        while (path.length() > 1 && path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        return path;
    }

    private String normalizeTitle(String title) {
        return title == null ? "" : title.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private boolean isPlaceholderSelector(String selector) {
        if (selector == null) return false;
        String normalized = selector.trim().toLowerCase(Locale.ROOT);
        return normalized.startsWith("copy_")
                || normalized.contains("copy_selector")
                || normalized.contains("copy_route")
                || normalized.contains("e.g.")
                || normalized.startsWith("selector ")
                || normalized.startsWith("path ")
                || normalized.equals("selector")
                || normalized.equals("#email")
                || normalized.contains("selector_from")
                || normalized.contains("source_context")
                || normalized.contains("selector not found")
                || normalized.contains("not available")
                || normalized.contains("placeholder");
    }

    private boolean isPlaceholderUiValue(String value) {
        if (value == null || value.trim().isEmpty()) return true;
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.startsWith("copy_")
                || normalized.contains("copy_value")
                || normalized.contains("value to input")
                || normalized.contains("input value")
                || normalized.contains("e.g.")
                || normalized.contains("placeholder")
                || normalized.equals("value")
                || normalized.equals("sample value");
    }

    private static class ValidationBucket {
        private final List<String> messages = new ArrayList<>();
        private int errors = 0;
        private int warnings = 0;

        void error(String message) {
            errors++;
            messages.add("ERROR: " + message);
        }

        void warn(String message) {
            warnings++;
            messages.add("WARNING: " + message);
        }
    }

    private static class SelectorSource {
        private final String selector;
        private final String filePath;
        private final String formAction;
        private final String role;

        SelectorSource(String selector, String filePath, String formAction, String role) {
            this.selector = selector;
            this.filePath = filePath != null ? filePath : "";
            this.formAction = formAction != null ? formAction : "";
            this.role = role != null ? role : "";
        }
    }

    private static class ApiEndpointSpec {
        private final String method;
        private final String path;
        private final Map<String, ApiFieldSpec> fields = new LinkedHashMap<>();
        private final Set<Integer> expectedStatuses = new HashSet<>();
        private boolean requiresAuth;

        ApiEndpointSpec(String method, String path) {
            this.method = method;
            this.path = path;
        }
    }

    private static class ApiFieldSpec {
        private final String name;
        private final String javaType;
        private final boolean required;

        ApiFieldSpec(String name, String javaType, boolean required) {
            this.name = name;
            this.javaType = javaType;
            this.required = required;
        }
    }

    /**
     * Replace raw control characters (newlines, tabs, carriage returns) that appear
     * inside JSON string values with their escaped equivalents.
     * Only replaces chars that are inside double-quoted strings (between " and ").
     */
    private String sanitizeJsonControlChars(String json) {
        StringBuilder sb = new StringBuilder(json.length());
        boolean inString = false;
        boolean escaped = false;
        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escaped) {
                sb.append(c);
                escaped = false;
                continue;
            }
            if (c == '\\') {
                escaped = true;
                sb.append(c);
                continue;
            }
            if (c == '"') {
                inString = !inString;
                sb.append(c);
                continue;
            }
            if (inString) {
                // Replace unescaped control characters inside strings
                if (c == '\n') { sb.append("\\n"); continue; }
                if (c == '\r') { sb.append("\\r"); continue; }
                if (c == '\t') { sb.append("\\t"); continue; }
                if (c < 0x20) { // other control chars
                    sb.append(String.format("\\u%04x", (int) c));
                    continue;
                }
            }
            sb.append(c);
        }
        return sb.toString();
    }

    // ── JSON → Plain Text Formatters ──────────────────────────────────────────

    /**
     * Parse Acceptance Criteria JSON array (e.g. ["AC1", "AC2"]) into bullet list.
     */
    private String formatAcceptanceCriteriaForPrompt(String acJson) {
        if (acJson == null || acJson.trim().isEmpty() || acJson.trim().equals("[]")) return "  (None provided)";
        try {
            JsonNode root = objectMapper.readTree(acJson);
            StringBuilder sb = new StringBuilder();
            if (root.isArray()) {
                int index = 1;
                for (JsonNode node : root) {
                    String criterionText = node.isObject() && node.has("criterion") ? node.get("criterion").asText() : node.asText();
                    sb.append("  AC-").append(index++).append(": ").append(criterionText).append("\n");
                }
                return sb.toString().trim();
            }
        } catch (Exception e) {
            log.warn("Could not parse acceptance criteria JSON, using raw string", e);
        }
        return "  " + acJson;
    }

    /**
     * Parse Use Case flow JSON (mainFlow / alternativeFlow) into readable text.
     * Supports {"steps":[...]} and {"flows":[{"name":...,"steps":[...]}]} formats.
     */
    private String formatFlowForPrompt(String flowJson, String indent) {
        if (flowJson == null || flowJson.trim().isEmpty() || flowJson.trim().equals("[]")) return indent + "None";
        try {
            JsonNode root = objectMapper.readTree(flowJson);
            StringBuilder sb = new StringBuilder();
            if (root.has("steps") && root.get("steps").isArray()) {
                int stepNum = 1;
                for (JsonNode step : root.get("steps")) {
                    sb.append(indent).append(stepNum++).append(". ").append(step.asText()).append("\n");
                }
                return sb.toString().trim();
            } else if (root.has("flows") && root.get("flows").isArray()) {
                for (JsonNode flow : root.get("flows")) {
                    sb.append(indent).append(flow.has("name") ? flow.get("name").asText() + ":\n" : "");
                    if (flow.has("steps") && flow.get("steps").isArray()) {
                        int stepNum = 1;
                        for (JsonNode step : flow.get("steps")) {
                            sb.append(indent).append("  ").append(stepNum++).append(". ").append(step.asText()).append("\n");
                        }
                    }
                    sb.append("\n");
                }
                return sb.toString().trim();
            } else if (root.isArray()) {
                int stepNum = 1;
                for (JsonNode step : root) {
                    sb.append(indent).append(stepNum++).append(". ").append(step.asText()).append("\n");
                }
                return sb.toString().trim();
            }
        } catch (Exception e) {
            // Fall through to return raw string
        }
        return indent + flowJson;
    }

    // ── Prompt Builder (8-Step QA Engineer Framework) ─────────────────────────

    private String buildPrompt(TestType testType, boolean smartMode, String requirementContext,
                               String useCaseContext, String additionalContext,
                               String selectorContext, String apiKnowledgeContext) {

        String basePrompt =
                "# ROLE\n" +
                "You are an AI QA Engineer integrated into DevTrack AI.\n" +
                "Your responsibility is NOT to immediately generate Test Cases.\n" +
                "Your first responsibility is to understand the software feature exactly as a human QA Engineer would.\n" +
                "Think step by step using every artifact linked to the Requirement.\n" +
                "This system is designed for student software projects (6–8 members per team), so your output must be practical, easy to understand, and easy to execute.\n" +
                "Do NOT generate unnecessary enterprise-level test cases.\n\n" +

                "====================================================\n" +
                "STEP 1 — Understand the Requirement\n" +
                "====================================================\n" +
                "Read the Requirement Title and Description.\n" +
                "Determine: What feature is being built? What problem does it solve? Who is the user? What is the expected behavior?\n" +
                "This gives you the overall business context. Do NOT generate test cases yet.\n\n" +

                "====================================================\n" +
                "STEP 2 — Analyze Acceptance Criteria\n" +
                "====================================================\n" +
                "For every Acceptance Criterion:\n" +
                "- Identify expected behavior.\n" +
                "- Identify success conditions.\n" +
                "- Identify validation rules.\n" +
                "- Identify possible failure scenarios.\n" +
                "These become the foundation of your Test Cases.\n\n" +

                "====================================================\n" +
                "STEP 3 — Analyze Linked Use Cases\n" +
                "====================================================\n" +
                "Read every linked Use Case. Identify: Main Flow, Alternative Flow, Exception Flow.\n" +
                "Understand how users interact with the system. Do not invent new flows unless they are clearly implied.\n\n" +

                "====================================================\n" +
                "STEP 4 — Extract Business Rules\n" +
                "====================================================\n" +
                "Extract only EXPLICITLY stated Business Rules from the Requirement, Acceptance Criteria, and Use Cases.\n" +
                "Look for: Required fields, Validation rules, Permission rules, Status transitions, Workflow constraints, Unique constraints, Length limits, Number ranges.\n" +
                "CRITICAL: If no Business Rules are explicitly provided, DO NOT invent them.\n" +
                "You may infer validation constraints ONLY when they are directly implied by the Acceptance Criteria.\n" +
                "Otherwise state: 'No explicit Business Rules were found.'\n\n" +

                "====================================================\n" +
                "STEP 5 — Analyze Additional Context\n" +
                "====================================================\n" +
                "Read the user's Additional Context. Treat it as a priority instruction.\n" +
                "Always follow this instruction while keeping the Requirement unchanged.\n\n" +

                "====================================================\n" +
                "STEP 6 — Build Understanding\n" +
                "====================================================\n" +
                "Before generating Test Cases, combine all information:\n" +
                "Requirement + Acceptance Criteria + Use Cases + Business Rules + Additional Context.\n" +
                "These together represent the complete understanding of the feature. Never rely on only one source.\n\n";

        // [NEW] Inject real selector context from GitHub source scan if available
        if (selectorContext != null && !selectorContext.isBlank()) {
            basePrompt +=
                "====================================================\n" +
                "STEP 6b \u2014 Structured Form Map (from GitHub source code)\n" +
                "====================================================\n" +
                "The following data was extracted DIRECTLY by parsing the actual HTML/JSP/JSX source files.\n" +
                "Every element object includes a pre-computed SELECTOR field.\n\n" +
                selectorContext + "\n" +
                "ABSOLUTE SELECTOR RULES — VIOLATION IS A CRITICAL ERROR:\n" +
                "1. For every UI test step that interacts with a form element, use the SELECTOR value from the STRUCTURED FORM MAP above.\n" +
                "2. Copy the SELECTOR value CHARACTER FOR CHARACTER. Example: if it says [name='input'], write [name='input'] — never [name='email'] or [name='username'].\n" +
                "3. Use the 'role' field to match elements to test steps: username_or_email_field → the field for entering username/email.\n" +
                "4. For buttons: use the selector shown. If it says button:has-text('Sign In'), use exactly that.\n" +
                "5. Keep each UI test case on ONE source form/page. If goto path is /login, use selectors from FORM action=\"login\" or the login file only. Do NOT mix register/reset selectors into a login test.\n" +
                "6. Infer goto path from the selected form action when available: action=\"login\" => /login, action=\"register\" => /register, action=\"reset\" => /reset.\n" +
                "7. NEVER invent a selector. NEVER use common-sense defaults like [name='email']. Only what is listed.\n" +
                "8. If a needed element is not in the selected form/page, write 'SELECTOR NOT FOUND IN SOURCE' and omit that step.\n" +
                "REMEMBER: The OUTPUT FORMAT example below uses placeholder values — those are NOT real selectors or routes for this project.\n\n";
        }

        // [NEW] Inject real API Knowledge from backend source code static analysis
        if (apiKnowledgeContext != null && !apiKnowledgeContext.isBlank()) {
            basePrompt +=
                "====================================================\n" +
                "STEP 6c \u2014 API KNOWLEDGE (from backend source code)\n" +
                "====================================================\n" +
                "The following API information was extracted DIRECTLY from backend source code.\n" +
                "It may include Spring mappings and Servlet @WebServlet endpoints. No guessing. Static analysis only.\n\n" +
                "ABSOLUTE API RULES \u2014 VIOLATION IS A CRITICAL ERROR:\n" +
                "1. Use ONLY endpoint paths listed below. NEVER invent an endpoint path.\n" +
                "2. NEVER change the HTTP method (e.g. GET\u2192POST is forbidden).\n" +
                "3. Copy field names CHARACTER FOR CHARACTER from the Request Body section.\n" +
                "4. Required fields without values MUST produce 400/422 test cases.\n" +
                "5. Respect validation constraints (email format, min/max, pattern) in boundary/negative cases.\n" +
                "6. Include Authorization header for ALL endpoints marked Auth=Required.\n" +
                "7. Use the listed expected status codes for assertions.\n" +
                "8. If the needed endpoint is NOT listed: set url='ENDPOINT NOT FOUND' and mark type=MANUAL.\n\n" +
                apiKnowledgeContext + "\n\n";
        } else {
            basePrompt +=
                "====================================================\n" +
                "STEP 6c \u2014 API KNOWLEDGE NOT AVAILABLE\n" +
                "====================================================\n" +
                "No backend API endpoint context was extracted from source code for this request.\n" +
                "Do NOT generate executable API test cases. In Smart mode, choose UI or MANUAL only.\n\n";
        }

        basePrompt +=
                "====================================================\n" +
                "STEP 7 \u2014 Generate Test Cases\n" +
                "====================================================\n" +
                "Generate Test Cases based on your understanding.\n" +
                "Cover: Positive scenarios, Negative scenarios, Validation scenarios, Boundary scenarios, Business Rule scenarios.\n" +
                "Do not create duplicated Test Cases.\n" +
                "CRITICAL RULES:\n" +
                "1. Every test case must directly validate at least one specific condition from the Acceptance Criteria.\n" +
                "2. Clearly define the system state required before the test begins (Precondition).\n" +
                "3. The final step of EVERY test case MUST be a verification step asserting the Expected Result.\n" +
                "4. Each test case must include coveredAcceptanceCriteria using IDs such as AC-1, AC-2.\n" +
                "5. Each test case must include scenarioType as one of: positive, negative, validation, boundary, security.\n" +
                "6. Each test case must include sourceGrounding using values from: REQUIREMENT, USE_CASE, API, SELECTOR.\n\n" +

                "====================================================\n" +
                "STEP 8 — Review Before Output\n" +
                "====================================================\n" +
                "Before returning the result, verify:\n" +
                "- Every Acceptance Criterion has at least one Test Case.\n" +
                "- Every Business Rule is covered.\n" +
                "- Main Flow is covered. Alternative Flow is covered. Validation is covered.\n" +
                "- Duplicate Test Cases are removed.\n" +
                "If coverage is incomplete, generate additional Test Cases before finishing.\n\n";

        // Test type instructions
        if (smartMode) {
            basePrompt += "For each test case, choose the most appropriate test type from: UI, API, MANUAL. Include the 'type' field in each test case JSON.\n\n";
        } else if (testType != null) {
            basePrompt += "Generate test cases matching the requested test type: " + testType.name() + ".\n\n";
        }

        String apiSourceRule = (apiKnowledgeContext != null && !apiKnowledgeContext.isBlank())
                ? "CRITICAL: Use ONLY endpoints and fields from STEP 6c API KNOWLEDGE. NEVER invent endpoint paths or request body fields.\n"
                : "CRITICAL: API source context was NOT provided. Do NOT generate executable API test cases or endpoint paths.\n";

        basePrompt += "API TEST CONSTRAINTS (inside 'configuration' object with 'type': 'API'):\n" +
                apiSourceRule +
                "CRITICAL — ALL these fields MUST be present and non-null for every API test case:\n" +
                "  - 'apiMethod': HTTP verb — exactly one of: GET, POST, PUT, DELETE, PATCH\n" +
                "  - 'apiUrl': full URL including host and path — e.g. http://localhost:8080/api/v1/auth/login\n" +
                "  - 'apiHeaders': JSON object — MUST include Content-Type: application/json. Add Authorization header if endpoint requires auth.\n" +
                "  - 'apiQueryParams': JSON object — use {} if none\n" +
                "  - 'apiBody': JSON object — request body fields. Use {} for GET/DELETE.\n" +
                "  - 'apiAssertions': array — MUST have at least one STATUS_CODE assertion.\n" +
                "Assertion format: { \"type\": \"STATUS_CODE\", \"operator\": \"EQUALS\", \"expectedValue\": \"200\" }\n" +
                "Other assertion types: JSON_PATH ({ \"type\": \"JSON_PATH\", \"property\": \"$.field\", \"operator\": \"EXISTS\" })\n" +
                "NEVER leave apiUrl as null. NEVER leave apiMethod as null.\n\n";

        String uiSelectorRule = (selectorContext != null && !selectorContext.isBlank())
                ? "- CRITICAL: Use ONLY selectors from the SOURCE CODE SELECTORS list in STEP 6b. Do NOT default to data-testid unless it appears in that list."
                : "- CRITICAL: Source selectors were NOT provided. Do NOT invent selectors such as [data-testid='...']. Only use selectors explicitly present in the requirement/additional context; otherwise generate MANUAL coverage instead of executable UI steps.";

        basePrompt += "UI TEST CONSTRAINTS (inside 'configuration' object with 'type': 'UI'):\n" +
                "- 'steps' array in 'configuration' must perfectly mirror the human-readable root 'steps' array.\n" +
                "- Every executable UI step MUST include: 'order', 'action', and 'description'.\n" +
                "- Allowed Actions: 'goto', 'fill', 'click', 'select', 'wait_for', 'expect_url', 'expect_text', 'expect_visible', 'expect_hidden'.\n" +
                "- For 'goto': include the real page path that matches the selected source form/page. Example shape only: { \"order\": 1, \"action\": \"goto\", \"path\": \"/real-route-from-source\" }.\n" +
                "- For 'fill', 'click', 'select', 'wait_for', 'expect_text', 'expect_visible', 'expect_hidden': include 'selector'.\n" +
                "- For 'fill' and 'select': include 'value'. For 'expect_url' and 'expect_text': include 'expected'.\n" +
                "- Do NOT put only natural language descriptions inside configuration.steps. Natural language belongs in the root 'steps' array.\n" +
                uiSelectorRule + "\n" +
                "- Allowed Assertions: 'expect_url', 'expect_text', 'expect_visible', 'expect_hidden'.\n\n";

        // Output format with structured reasoning template
        basePrompt += "OUTPUT FORMAT\n" +
                "Return a valid JSON object with this EXACT structure (NO markdown code blocks, NO extra text outside the JSON).\n" +
                (selectorContext != null && !selectorContext.isBlank()
                    ? "IMPORTANT: ALL route/selector/value strings shown as COPY_* below are PLACEHOLDERS ONLY. You MUST replace them with actual values from the selected source form/page and requirement. Do NOT copy /login unless the selected source form/page is actually login.\n"
                    : "") +
                "The 'reasoning' field MUST follow this EXACT template format:\n\n" +
                "REQUIREMENT ANALYSIS:\n" +
                "✔ Feature: [feature name]\n" +
                "✔ Actor: [primary user role]\n" +
                "✔ Expected Behavior: [what should happen]\n" +
                "\n" +
                "ACCEPTANCE CRITERIA:\n" +
                "✔ AC-1: [criterion]\n" +
                "✔ AC-2: [criterion]\n" +
                "...\n" +
                "\n" +
                "USE CASES:\n" +
                "✔ [Use Case Name] - Main Flow: [summary]\n" +
                "✔ [Use Case Name] - Alternative Flow: [summary]\n" +
                "(If no Use Cases provided, write: 'No linked Use Cases.')\n" +
                "\n" +
                "BUSINESS RULES:\n" +
                "✔ [rule] (only if explicitly stated)\n" +
                "(If none found, write: 'No explicit Business Rules were found.')\n" +
                "\n" +
                "The 'coverageSummary' field MUST follow this template:\n" +
                "COVERAGE:\n" +
                "✔ Positive: [count] cases\n" +
                "✔ Negative: [count] cases\n" +
                "✔ Validation: [count] cases\n" +
                "✔ Boundary: [count] cases\n" +
                "✔ Total: [count] cases\n\n";

        String structure = "{\n" +
                "  \"reasoning\": \"Your structured analysis following the template above.\",\n" +
                "  \"coverageSummary\": \"Your coverage summary following the template above.\",\n" +
                "  \"testCases\": [\n" +
                "    {\n" +
                "      \"title\": \"Feature UI - validates one source-backed flow\",\n" +
                "      \"type\": \"UI\",\n" +
                "      \"coveredAcceptanceCriteria\": [\"AC-1\"],\n" +
                "      \"coveredUseCases\": [\"Selected use case name\"],\n" +
                "      \"scenarioType\": \"validation\",\n" +
                "      \"sourceGrounding\": [\"REQUIREMENT\", \"SELECTOR\"],\n" +
                "      \"precondition\": \"User can open the selected source-backed page.\",\n" +
                "      \"expectedResult\": \"The selected flow shows the expected result from the requirement.\",\n" +
                "      \"configuration\": {\n" +
                "        \"type\": \"UI\",\n" +
                "        \"baseUrl\": \"http://localhost:5173\",\n" +
                "        \"steps\": [\n" +
                "          { \"order\": 1, \"action\": \"goto\", \"path\": \"/route-from-form-action\", \"description\": \"Open selected source-backed page\" },\n" +
                "          { \"order\": 2, \"action\": \"fill\", \"selector\": \"[name='fieldName']\", \"value\": \"actual-scenario-value\", \"description\": \"Enter scenario value\" },\n" +
                "          { \"order\": 3, \"action\": \"expect_text\", \"selector\": \"[name='resultField']\", \"expected\": \"expected-result-text\", \"description\": \"Verify expected result\" }\n" +
                "        ]\n" +
                "      },\n" +
                "      \"steps\": [\n" +
                "        { \"stepNumber\": 1, \"description\": \"Open selected source-backed page\" },\n" +
                "        { \"stepNumber\": 2, \"description\": \"Enter scenario value\" },\n" +
                "        { \"stepNumber\": 3, \"description\": \"Verify expected result\" }\n" +
                "      ]\n" +
                "    },\n" +
                "    {\n" +
                "      \"title\": \"POST /api/v1/auth/login — success with valid credentials\",\n" +
                "      \"type\": \"API\",\n" +
                "      \"coveredAcceptanceCriteria\": [\"AC-1\"],\n" +
                "      \"coveredUseCases\": [\"Login with valid credentials\"],\n" +
                "      \"scenarioType\": \"positive\",\n" +
                "      \"sourceGrounding\": [\"REQUIREMENT\", \"API\"],\n" +
                "      \"precondition\": \"User account exists in the system with email test@example.com.\",\n" +
                "      \"expectedResult\": \"Response status 200. Response body contains accessToken field.\",\n" +
                "      \"configuration\": {\n" +
                "        \"type\": \"API\",\n" +
                "        \"apiMethod\": \"POST\",\n" +
                "        \"apiUrl\": \"http://localhost:8080/api/v1/auth/login\",\n" +
                "        \"apiHeaders\": { \"Content-Type\": \"application/json\" },\n" +
                "        \"apiQueryParams\": {},\n" +
                "        \"apiBody\": { \"email\": \"test@example.com\", \"password\": \"password123\" },\n" +
                "        \"apiAssertions\": [\n" +
                "          { \"type\": \"STATUS_CODE\", \"operator\": \"EQUALS\", \"expectedValue\": \"200\" },\n" +
                "          { \"type\": \"JSON_PATH\", \"property\": \"$.accessToken\", \"operator\": \"EXISTS\" }\n" +
                "        ]\n" +
                "      },\n" +
                "      \"steps\": [\n" +
                "        { \"stepNumber\": 1, \"description\": \"Send POST /api/v1/auth/login with valid email and password\" },\n" +
                "        { \"stepNumber\": 2, \"description\": \"Verify response status is 200\" },\n" +
                "        { \"stepNumber\": 3, \"description\": \"Verify response body contains accessToken\" }\n" +
                "      ]\n" +
                "    },\n" +
                "    {\n" +
                "      \"title\": \"POST /api/v1/auth/login — fail with wrong password\",\n" +
                "      \"type\": \"API\",\n" +
                "      \"coveredAcceptanceCriteria\": [\"AC-2\"],\n" +
                "      \"coveredUseCases\": [\"Login with invalid credentials\"],\n" +
                "      \"scenarioType\": \"negative\",\n" +
                "      \"sourceGrounding\": [\"REQUIREMENT\", \"API\"],\n" +
                "      \"precondition\": \"User account exists with email test@example.com.\",\n" +
                "      \"expectedResult\": \"Response status 401. Response body contains error message.\",\n" +
                "      \"configuration\": {\n" +
                "        \"type\": \"API\",\n" +
                "        \"apiMethod\": \"POST\",\n" +
                "        \"apiUrl\": \"http://localhost:8080/api/v1/auth/login\",\n" +
                "        \"apiHeaders\": { \"Content-Type\": \"application/json\" },\n" +
                "        \"apiQueryParams\": {},\n" +
                "        \"apiBody\": { \"email\": \"test@example.com\", \"password\": \"wrongpassword\" },\n" +
                "        \"apiAssertions\": [\n" +
                "          { \"type\": \"STATUS_CODE\", \"operator\": \"EQUALS\", \"expectedValue\": \"401\" }\n" +
                "        ]\n" +
                "      },\n" +
                "      \"steps\": [\n" +
                "        { \"stepNumber\": 1, \"description\": \"Send POST /api/v1/auth/login with wrong password\" },\n" +
                "        { \"stepNumber\": 2, \"description\": \"Verify response status is 401\" }\n" +
                "      ]\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        return basePrompt + structure + "\n\n" +
                "====================================================\n" +
                "INPUT DATA\n" +
                "====================================================\n\n" +
                (requirementContext != null && !requirementContext.isEmpty() ? requirementContext : "") +
                (useCaseContext != null && !useCaseContext.isEmpty() ? useCaseContext : "LINKED USE CASES:\n  (None)\n\n") +
                "ADDITIONAL CONTEXT/INSTRUCTIONS:\n" +
                (additionalContext != null && !additionalContext.isEmpty() ? additionalContext : "None");
    }

    public org.example.backend.entity.AiGenerationStaging createProcessingStaging(AiTestCaseGenerateRequest request, Long projectId) {
        Requirement req = requirementRepository.findById(request.getRequirementId())
                .orElseThrow(() -> new BusinessException("Requirement not found"));
        if (req.getProject() == null || !projectId.equals(req.getProject().getId())) {
            throw new BusinessException("Requirement does not belong to this project.");
        }
        
        validateAiGenerationConstraints(req, request.isDiscardExisting());

        org.example.backend.entity.Project project = new org.example.backend.entity.Project();
        project.setId(projectId);

        org.example.backend.entity.AiGenerationStaging staging = new org.example.backend.entity.AiGenerationStaging();
        staging.setProject(project);
        staging.setGenerationId(java.util.UUID.randomUUID());
        staging.setRequirementId(request.getRequirementId());
        staging.setStage(org.example.backend.entity.AiStage.TEST_CASE);
        staging.setStatus(org.example.backend.entity.AiGenerationStatus.PROCESSING);
        staging.setPayload(objectMapper.createObjectNode());
        
        return stagingRepository.save(staging);
    }

    private void validateAiGenerationConstraints(Requirement req, boolean discardExisting) {
        if (req.getProject() == null || req.getProject().getId() == null)
            return;

        List<org.example.backend.entity.AiGenerationStaging> recentStagings = stagingRepository
                .findRecentByRequirementId(req.getProject().getId(), req.getId());

        if (recentStagings.isEmpty())
            return;

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime processingTimeout = now.minusMinutes(15);
        java.time.LocalDateTime reqUpdated = req.getUpdatedAt() != null ? req.getUpdatedAt() : req.getCreatedAt();

        for (org.example.backend.entity.AiGenerationStaging stg : recentStagings) {
            if (stg.getStatus() == org.example.backend.entity.AiGenerationStatus.PROCESSING) {
                if (stg.getCreatedAt() != null && stg.getCreatedAt().isBefore(processingTimeout)) {
                    stg.setStatus(org.example.backend.entity.AiGenerationStatus.DISCARDED);
                    stagingRepository.save(stg);
                    log.info("Auto-discarded stale PROCESSING staging {} for requirement {}", stg.getId(), req.getId());
                } else {
                    throw new BusinessException("A generation is currently in progress. Please wait.");
                }
            }
        }

        // 1. Lazy Expire PENDING + Staging Check
        for (org.example.backend.entity.AiGenerationStaging stg : recentStagings) {
            if (stg.getStatus() == org.example.backend.entity.AiGenerationStatus.PENDING) {
                if (reqUpdated != null && reqUpdated.isAfter(stg.getCreatedAt())) {
                    // Requirement has been updated, auto-reject old pending
                    stg.setStatus(org.example.backend.entity.AiGenerationStatus.DISCARDED);
                    stagingRepository.save(stg);
                    log.info("Auto-rejected obsolete PENDING staging {} for requirement {}", stg.getId(), req.getId());
                } else if (discardExisting) {
                    stg.setStatus(org.example.backend.entity.AiGenerationStatus.DISCARDED);
                    stagingRepository.save(stg);
                    log.info("Discarded existing PENDING staging {} as requested for requirement {}", stg.getId(), req.getId());
                } else {
                    throw new BusinessException(
                            "You have an unreviewed PENDING generation for this requirement. Please review or reject it first.",
                            "PENDING_EXISTS");
                }
            }
        }

        // 2. Cooldown Check (1 minute) — only against non-PENDING/non-DISCARDED records
        org.example.backend.entity.AiGenerationStaging latestActive = recentStagings.stream()
                .filter(s -> s.getStatus() != org.example.backend.entity.AiGenerationStatus.PENDING
                          && s.getStatus() != org.example.backend.entity.AiGenerationStatus.DISCARDED)
                .findFirst().orElse(null);
        if (latestActive != null && latestActive.getCreatedAt().plusMinutes(1).isAfter(now)) {
            throw new BusinessException(
                    "Please wait at least 1 minute before generating test cases for this requirement again.");
        }
    }

    public String analyzeCoverage(Long requirementId, Long projectId) {
        Requirement req = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new BusinessException("Requirement not found"));

        List<org.example.backend.entity.TestCase> existingTestCases = testCaseRepository.findByRequirementIdAndProjectId(requirementId, projectId);

        String prompt = "You are an elite QA Automation Architect. Your task is to analyze the coverage of the following existing test cases against the given requirement.\n\n" +
                "Requirement Details:\n" +
                "Title: " + req.getTitle() + "\n" +
                "Description: " + (req.getDescription() != null ? req.getDescription() : "None") + "\n" +
                "Acceptance Criteria:\n" + formatAcceptanceCriteriaForPrompt(req.getAcceptanceCriteria()) + "\n\n" +
                "Existing Test Cases:\n";

        if (existingTestCases.isEmpty()) {
            prompt += "(No test cases currently exist for this requirement.)\n\n";
        } else {
            for (org.example.backend.entity.TestCase tc : existingTestCases) {
                prompt += "- [" + tc.getType().name() + "] " + tc.getTitle() + "\n";
            }
            prompt += "\n";
        }

        prompt += "Analyze coverage. Return explicit plain text only. Use simple bullet points (-). DO NOT use Markdown headers (#) or bold (**). Do not return JSON. Provide a concise summary of what is covered and what is missing.";

        return aiRoutingService.generateText(prompt);
    }

    public List<org.example.backend.dto.testing.AiDraftTestCase> refineTestCases(org.example.backend.dto.testing.RefineAiRequest request) {
        String existingJson;
        try {
            existingJson = objectMapper.writeValueAsString(request.getExistingTestCases());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize test cases to JSON", e);
            throw new BusinessException("Không thể serialize test cases: " + e.getMessage());
        }

        String prompt = "You are an elite QA Automation Architect. I have a list of draft test cases in JSON format. Modify these JSON test cases according to the instruction below.\n\n" +
                "Instruction: " + request.getInstruction() + "\n\n" +
                "Existing Test Cases JSON:\n" + existingJson + "\n\n" +
                "Return ONLY the updated JSON array matching the exact structure of the input (NO markdown code blocks, NO extra text). " +
                "Preserve requirementId, coveredAcceptanceCriteria, coveredUseCases, scenarioType, and sourceGrounding unless the instruction explicitly changes them.";

        String rawJson = aiRoutingService.generateText(prompt);
        List<AiDraftTestCase> refined = parseJsonObject(rawJson, new TypeReference<List<org.example.backend.dto.testing.AiDraftTestCase>>() {});
        if (refined == null) return List.of();

        return refined.stream()
                .filter(Objects::nonNull)
                .peek(draft -> {
                    if (draft.getScenarioType() == null || draft.getScenarioType().isBlank()) {
                        draft.setScenarioType(inferScenarioType(draft));
                    }
                    draft.setValidationStatus("WARNING");
                    draft.setValidationMessages(new ArrayList<>(List.of(
                            "WARNING: Refined after automatic validation; please review manually before approval."
                    )));
                })
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
