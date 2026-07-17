package org.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.testing.AiTestCaseGenerateRequest;
import org.example.backend.dto.testing.AiTestCaseGenerateResponse;
import org.example.backend.dto.testing.TestCaseRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.UseCase;
import org.example.backend.entity.enums.TestType;
import org.example.backend.exception.BusinessException;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UseCaseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
        return generateTestCases(request, null);
    }

    public AiTestCaseGenerateResponse generateTestCases(AiTestCaseGenerateRequest request, String selectorContext) {
        String requirementContext = "";
        String useCaseContext = "";
        if (request.getRequirementId() != null) {
            Requirement req = requirementRepository.findById(request.getRequirementId()).orElse(null);
            if (req != null) {
                // validateAiGenerationConstraints is now called before calling this method


                requirementContext = "REQUIREMENT DETAILS:\n" +
                        "Title: " + req.getTitle() + "\n" +
                        "Description: " + (req.getDescription() != null ? req.getDescription() : "None") + "\n" +
                        "Priority: " + (req.getPriority() != null ? req.getPriority().name() : "Not set") + "\n" +
                        "Acceptance Criteria:\n" + formatAcceptanceCriteriaForPrompt(req.getAcceptanceCriteria()) + "\n\n";

                // Fetch linked Use Cases (avoid LazyInitializationException)
                List<UseCase> useCases = useCaseRepository.findByRequirementId(req.getId());
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
                useCaseContext, request.getAdditionalContext(), selectorContext);

        // Use GeminiService (with key rotation, 503 retry, and OpenRouter fallback)
        String rawJson = aiRoutingService.generateText(prompt);
        AiTestCaseGenerateResponse generatedResponse = parseJsonObject(rawJson, new TypeReference<AiTestCaseGenerateResponse>() {});

        if (generatedResponse != null && generatedResponse.getTestCases() != null) {
            for (TestCaseRequest generatedRequest : generatedResponse.getTestCases()) {
                if (!request.isSmartMode() && request.getTestType() != null) {
                    generatedRequest.setType(request.getTestType());
                }
                if (request.getRequirementId() != null) {
                    generatedRequest.setRequirementId(request.getRequirementId());
                }
            }
        }
        return generatedResponse;
    }

    private <T> T parseJsonObject(String rawJson, TypeReference<T> typeRef) {
        try {
            String cleanJson = rawJson.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            } else if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }
            cleanJson = cleanJson.trim();

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

            return objectMapper.readValue(cleanJson, typeRef);
        } catch (Exception e) {
            log.error("Failed to parse JSON from AI: \n" + rawJson, e);
            throw new BusinessException("Không thể parse kết quả từ AI. Định dạng lỗi.");
        }
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
                               String useCaseContext, String additionalContext, String selectorContext) {

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
                "STEP 6b \u2014 Source Code Selector Map (from GitHub)\n" +
                "====================================================\n" +
                selectorContext + "\n" +
                "CRITICAL SELECTOR RULE:\n" +
                "- For ALL UI test case steps, you MUST use selectors from the SOURCE CODE SELECTORS list above.\n" +
                "- Prefer 'data-testid' selectors first, then 'id', then 'name', then 'aria-label', then 'placeholder'.\n" +
                "- Format: [data-testid='value'] for data-testid, #value for id, [name='value'] for name.\n" +
                "- If the exact element you need is not listed, use: button:has-text('ButtonText') or role selectors.\n" +
                "- Do NOT invent selectors like [data-testid='submit-btn'] if 'submit-btn' is not in the list above.\n\n";
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
                "3. The final step of EVERY test case MUST be a verification step asserting the Expected Result.\n\n" +

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

        basePrompt += "API TEST CONSTRAINTS (inside 'configuration' object with 'type': 'API'):\n" +
                "- Explicitly define the 'Authorization' header in 'apiHeaders' if the endpoint requires authentication.\n" +
                "- Include 'apiQueryParams' if the API requires URL parameters.\n" +
                "- Generate cases that assert 4xx/5xx HTTP status codes along with success cases.\n\n";

        basePrompt += "UI TEST CONSTRAINTS (inside 'configuration' object with 'type': 'UI'):\n" +
                "- 'steps' array in 'configuration' must perfectly mirror the human-readable root 'steps' array.\n" +
                "- Allowed Actions: 'goto', 'fill', 'click', 'select', 'wait_for'.\n" +
                "- CRITICAL: Use 'data-testid' attributes for selectors whenever possible.\n" +
                "- Allowed Assertions: 'expect_url', 'expect_text', 'expect_visible', 'expect_hidden'.\n\n";

        // Output format with structured reasoning template
        basePrompt += "OUTPUT FORMAT\n" +
                "Return a valid JSON object with this EXACT structure (NO markdown code blocks, NO extra text outside the JSON).\n" +
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
                "      \"title\": \"Login fails with unregistered email\",\n" +
                "      \"type\": \"UI\",\n" +
                "      \"precondition\": \"User is on the login page.\",\n" +
                "      \"expectedResult\": \"System displays error message 'Invalid credentials'.\",\n" +
                "      \"configuration\": {\n" +
                "        \"type\": \"UI\",\n" +
                "        \"baseUrl\": \"https://example.com/login\",\n" +
                "        \"steps\": [\n" +
                "          { \"action\": \"goto\", \"path\": \"/login\" },\n" +
                "          { \"action\": \"fill\", \"selector\": \"[data-testid='email-input']\", \"value\": \"unregistered@abc.com\" },\n" +
                "          { \"action\": \"click\", \"selector\": \"[data-testid='submit-btn']\" },\n" +
                "          { \"action\": \"expect_text\", \"selector\": \".error-toast\", \"expected\": \"Invalid credentials\" }\n" +
                "        ]\n" +
                "      },\n" +
                "      \"steps\": [\n" +
                "        { \"stepNumber\": 1, \"description\": \"Navigate to the login page\" },\n" +
                "        { \"stepNumber\": 2, \"description\": \"Enter unregistered email\" },\n" +
                "        { \"stepNumber\": 3, \"description\": \"Click Submit\" },\n" +
                "        { \"stepNumber\": 4, \"description\": \"Verify error message appears\" }\n" +
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
            
        if (stagingRepository.existsByRequirementIdAndStatus(req.getId(), org.example.backend.entity.AiGenerationStatus.PROCESSING)) {
            throw new BusinessException("A generation is currently in progress. Please wait.");
        }

        List<org.example.backend.entity.AiGenerationStaging> recentStagings = stagingRepository
                .findRecentByRequirementId(req.getProject().getId(), req.getId());

        if (recentStagings.isEmpty())
            return;

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime reqUpdated = req.getUpdatedAt() != null ? req.getUpdatedAt() : req.getCreatedAt();

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

        // 3. Daily Quota Check (Max 3 times per day per HCM timezone)
        java.time.ZoneId zoneId = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        java.time.LocalDate today = java.time.ZonedDateTime.now(zoneId).toLocalDate();

        long countToday = recentStagings.stream().filter(stg -> stg.getCreatedAt().atZone(java.time.ZoneId.of("UTC"))
                .withZoneSameInstant(zoneId).toLocalDate().equals(today)).count();

        if (countToday >= 3) {
            // Check if Requirement was updated after the latest generation
            org.example.backend.entity.AiGenerationStaging mostRecent = recentStagings.get(0);
            if (reqUpdated != null && reqUpdated.isAfter(mostRecent.getCreatedAt())) {
                log.info("Quota limit reached (3/day) but requirement {} was updated. Resetting quota.", req.getId());
            } else {
                throw new BusinessException(
                        "Daily generation quota reached (3 times) for this requirement. Please try again tomorrow or update the requirement.");
            }
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
                "Return ONLY the updated JSON array matching the exact structure of the input (NO markdown code blocks, NO extra text).";

        String rawJson = aiRoutingService.generateText(prompt);
        return parseJsonObject(rawJson, new TypeReference<List<org.example.backend.dto.testing.AiDraftTestCase>>() {});
    }
}
