package org.example.backend.service;

import org.example.backend.config.NotificationWebSocketHandler;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.example.backend.entity.AiGenerationStaging;
import org.example.backend.entity.AiGenerationStatus;
import org.example.backend.service.AiRoutingService;
import org.example.backend.entity.AiStage;
import org.example.backend.entity.Project;
import org.example.backend.repository.AiGenerationStagingRepository;
import org.example.backend.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.DigestUtils;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.RequirementType;
import org.example.backend.entity.Priority;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.entity.UserAccount;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.repository.TestStepRepository;
import org.example.backend.entity.TestCase;
import org.example.backend.entity.TestStep;
import org.example.backend.entity.UseCase;
import org.example.backend.entity.UseCaseActor;
import org.example.backend.entity.enums.TestCaseStatus;
import org.example.backend.entity.enums.TestType;
import org.example.backend.service.AuditService;
import org.example.backend.exception.BusinessException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AiGenerationService {

    private final DocumentParserService documentParserService;
    private final AiRoutingService geminiService;
    private final RequirementGeminiService requirementGeminiService;
    private final UseCaseGeminiService useCaseGeminiService;
    private final AiGenerationStagingRepository stagingRepository;
    private final ProjectRepository projectRepository;
    private final RequirementRepository requirementRepository;
    private final org.example.backend.repository.UseCaseRepository useCaseRepository;
    private final UserAccountRepository userRepository;
    private final org.example.backend.repository.ProjectActorRepository projectActorRepository;
    private final ObjectMapper objectMapper;
    private final TestCaseRepository testCaseRepository;
    private final TestStepRepository testStepRepository;
    private final org.example.backend.mapper.testing.TestCaseMapper testCaseMapper;
    private final AuditService auditService;
    private final org.example.backend.repository.BusinessModuleRepository businessModuleRepository;
    private final org.example.backend.repository.TaskRepository taskRepository;
    private final org.example.backend.repository.ProjectMemberRepository projectMemberRepository;

    @Autowired
    private org.example.backend.service.ai.usecase.UseCaseGenerationFingerprintService useCaseGenerationFingerprintService;
    @Autowired
    private org.example.backend.service.ai.usecase.UseCaseGenerationContextBuilder useCaseGenerationContextBuilder;
    @Autowired
    private org.example.backend.service.ai.usecase.ActorDiscoveryService actorDiscoveryService;
    @Autowired
    private org.example.backend.service.ai.usecase.UseCasePlanningService useCasePlanningService;
    @Autowired
    private org.example.backend.service.ai.usecase.DetailedUseCaseGenerationService detailedUseCaseGenerationService;
    @Autowired
    private org.example.backend.service.ai.usecase.UseCaseReconciliationService useCaseReconciliationService;
    @Autowired
    private org.example.backend.service.ai.usecase.UseCaseCoverageService useCaseCoverageService;
    @Autowired
    private org.example.backend.service.ai.usecase.UseCaseGenerationValidator useCaseGenerationValidator;
    @Autowired
    private org.example.backend.service.ai.usecase.UseCaseGenerationPayloadNormalizer useCaseGenerationPayloadNormalizer;
    @Autowired
    private org.example.backend.service.ai.usecase.ModuleDiscoveryService moduleDiscoveryService;
    @Autowired
    private org.example.backend.service.ai.usecase.UseCaseGenerationGapAnalysisService gapAnalysisService;
    @Autowired
    private org.example.backend.service.ai.usecase.ActorReferenceMergeService actorReferenceMergeService;
    @Autowired
    private org.example.backend.service.AiGenerationStagingService aiGenerationStagingService;

    @Autowired
    public AiGenerationService(DocumentParserService documentParserService,
                               AiRoutingService geminiService,
                               RequirementGeminiService requirementGeminiService,
                               UseCaseGeminiService useCaseGeminiService,
                               AiGenerationStagingRepository stagingRepository,
                               ProjectRepository projectRepository,
                               RequirementRepository requirementRepository,
                               org.example.backend.repository.UseCaseRepository useCaseRepository,
                               UserAccountRepository userRepository,
                               org.example.backend.repository.ProjectActorRepository projectActorRepository,
                               ObjectMapper objectMapper,
                               TestCaseRepository testCaseRepository,
                               TestStepRepository testStepRepository,
                               org.example.backend.mapper.testing.TestCaseMapper testCaseMapper,
                               AuditService auditService,
                               org.example.backend.repository.BusinessModuleRepository businessModuleRepository,
                               org.example.backend.repository.TaskRepository taskRepository,
                               org.example.backend.repository.ProjectMemberRepository projectMemberRepository) {
        this.documentParserService = documentParserService;
        this.geminiService = geminiService;
        this.requirementGeminiService = requirementGeminiService;
        this.useCaseGeminiService = useCaseGeminiService;
        this.stagingRepository = stagingRepository;
        this.projectRepository = projectRepository;
        this.requirementRepository = requirementRepository;
        this.useCaseRepository = useCaseRepository;
        this.userRepository = userRepository;
        this.projectActorRepository = projectActorRepository;
        this.objectMapper = objectMapper;
        this.testCaseRepository = testCaseRepository;
        this.testStepRepository = testStepRepository;
        this.testCaseMapper = testCaseMapper;
        this.auditService = auditService;
        this.businessModuleRepository = businessModuleRepository;
        this.taskRepository = taskRepository;
        this.projectMemberRepository = projectMemberRepository;
    }

    @Transactional
    public UUID generateRequirementsFromFile(Long projectId, MultipartFile file, Long userId, String userPrompt) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án với ID: " + projectId));

        String fileHash;
        try {
            fileHash = DigestUtils.md5DigestAsHex(file.getBytes());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi đọc file để tạo mã băm: " + e.getMessage(), e);
        }

        sendProgress(userId, 0, "Checking cache for existing file...");
        java.util.Optional<AiGenerationStaging> existingCache = stagingRepository.findFirstByFileHashAndProjectIdAndStageOrderByCreatedAtDesc(fileHash, projectId, AiStage.REQUIREMENT);
        
        String documentText = null;
        JsonNode payload;
        String contextWarning = null;
        
        if (existingCache.isPresent() && existingCache.get().getPayload() != null) {
            sendProgress(userId, 1, "File exact match found in cache! Verifying...");
            try { Thread.sleep(3000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            sendProgress(userId, 2, "Skipping Gemini API analysis. Rebuilding structure...");
            try { Thread.sleep(4000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            sendProgress(userId, 3, "Restoring previous AI results...");
            try { Thread.sleep(3000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            
            payload = existingCache.get().getPayload();
            documentText = existingCache.get().getDocumentText();
            
            // Self-healing for old cache records that didn't have documentText
            if (documentText == null || documentText.isEmpty()) {
                documentText = documentParserService.parseDocument(file);
                AiGenerationStaging oldStaging = existingCache.get();
                oldStaging.setDocumentText(documentText);
                stagingRepository.save(oldStaging);
            }
        } else {
            sendProgress(userId, 0, "Reading and processing file...");
            // 1. Parse text from file
            String rawDocumentText = documentParserService.parseDocument(file);
            documentText = rawDocumentText;

            sendProgress(userId, 1, "AI is evaluating document relevance...");

            List<Requirement> contextReqs = requirementRepository.findTop10ByProjectIdAndIsDeletedFalseOrderByCreatedAtDesc(projectId);
            List<String> contextStrings = new ArrayList<>();
            for (Requirement r : contextReqs) {
                contextStrings.add(r.getTitle() + (r.getDescription() != null ? ": " + r.getDescription() : ""));
            }
            
            String evalJson = requirementGeminiService.evaluateDocumentContext(contextStrings, rawDocumentText);
            try {
                JsonNode evalNode = objectMapper.readTree(evalJson);
                int score = evalNode.has("relevanceScore") ? evalNode.get("relevanceScore").asInt() : 100;
                String reason = evalNode.has("reason") ? evalNode.get("reason").asText() : "";
                
                if (score < 40) {
                    throw new org.example.backend.exception.BusinessException("Document rejected due to context mismatch with the project (Relevance score: " + score + "%). Reason: " + reason);
                } else if (score < 100) {
                    contextWarning = reason;
                }
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                log.warn("Failed to parse context evaluation JSON: {}", evalJson);
            }

            if (userPrompt != null && !userPrompt.trim().isEmpty()) {
                documentText = "=== USER ADDITIONAL INSTRUCTIONS ===\n" +
                        userPrompt + "\n" +
                        "=== END OF USER INSTRUCTIONS ===\n\n" +
                        "CRITICAL INSTRUCTION FOR AI: You MUST critically evaluate the 'USER ADDITIONAL INSTRUCTIONS' provided above. If the text is meaningless, conversational chit-chat, spam, or entirely unrelated to software engineering and project requirements, you MUST completely ignore it and proceed with analyzing the main document below. Only apply these instructions if they provide valid, constructive context or constraints for generating the software requirements.\n" +
                        "====================================\n\n" +
                        rawDocumentText;
            }

            sendProgress(userId, 2, "AI is analyzing and extracting requirements...");
            // 2. Call Gemini API to extract requirements JSON
            // 2. Call Gemini API to extract requirements JSON
            String rawJsonResponse = requirementGeminiService.extractRequirementsFromText(documentText, project);
            
            JsonNode reqsArray;
            JsonNode actorsArray;
            try {
                JsonNode rawNode = objectMapper.readTree(rawJsonResponse);
                reqsArray = rawNode.has("requirements") ? rawNode.get("requirements") : rawNode;
                actorsArray = rawNode.has("project_actors") ? rawNode.get("project_actors") : objectMapper.createArrayNode();
            } catch (Exception e) {
                log.error("Error parsing raw JSON: {}", e.getMessage());
                throw new RuntimeException("Lỗi khi đọc kết quả thô từ AI.");
            }

            sendProgress(userId, 3, "AI Critic is reviewing requirement quality and checking semantics duplicates...");
            // 3. Call AI Critic to evaluate
            String criticizedJsonResponse = requirementGeminiService.evaluateRequirementsWithCritic(reqsArray.toString(), documentText, contextStrings);

            sendProgress(userId, 4, "Finalizing results and saving to database...");
            // 4. Parse JSON response to ensure it's valid
            try {
                JsonNode criticizedNode = objectMapper.readTree(criticizedJsonResponse);
                if (criticizedNode.isObject() && criticizedNode.has("requirements")) {
                    criticizedNode = criticizedNode.get("requirements");
                }
                
                if (!criticizedNode.isArray()) {
                    log.error("Gemini did not return a valid JSON array. Response: {}", criticizedJsonResponse);
                    throw new RuntimeException("Gemini không trả về danh sách (Array) JSON hợp lệ.");
                }
                
                com.fasterxml.jackson.databind.node.ObjectNode finalPayload = objectMapper.createObjectNode();
                finalPayload.set("project_actors", actorsArray);
                finalPayload.set("requirements", criticizedNode);
                payload = finalPayload;
            } catch (Exception e) {
                log.error("Error parsing Gemini JSON: {}", e.getMessage(), e);
                throw new RuntimeException("Lỗi khi đọc JSON từ Gemini. Vui lòng thử lại.");
            }
        }

        // 4. Save to staging table
        UUID generationId = UUID.randomUUID();
        AiGenerationStaging staging = AiGenerationStaging.builder()
                .project(project)
                .generationId(generationId)
                .stage(AiStage.REQUIREMENT)
                .payload(payload)
                .fileHash(fileHash)
                .documentText(documentText)
                .contextWarning(contextWarning)
                .status(AiGenerationStatus.PENDING)
                .build();

        stagingRepository.save(staging);

        sendProgress(userId, 5, "Done!");
        return generationId;
    }

    @Transactional
    public UUID startUseCaseGenerationV2(Long projectId, org.example.backend.dto.AiUseCaseGenerateRequest request, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with ID: " + projectId));

        if (request.getRequirementIds() == null || request.getRequirementIds().isEmpty()) {
            throw new RuntimeException("Requirement list must not be empty.");
        }

        UUID generationId = UUID.randomUUID();
        ObjectNode processingPayload = objectMapper.createObjectNode();
        processingPayload.put("status", "PROCESSING");
        processingPayload.put("message", "Use case generation is running.");

        AiGenerationStaging staging = AiGenerationStaging.builder()
                .project(project)
                .generationId(generationId)
                .stage(AiStage.USE_CASE)
                .payload(processingPayload)
                .status(AiGenerationStatus.PROCESSING)
                .build();

        stagingRepository.save(staging);
        sendProgress(userId, 1, "Starting Use Case generation...");
        return generationId;
    }

    public void completeUseCaseGenerationV2(UUID generationId, Long projectId, org.example.backend.dto.AiUseCaseGenerateRequest request, Long userId) {
        AiGenerationStaging staging = stagingRepository.findByGenerationId(generationId).stream().findFirst().orElse(null);
        if (staging == null) {
            log.warn("Use Case generation staging {} was not found.", generationId);
            return;
        }

        if (staging.getStatus() != AiGenerationStatus.PROCESSING) {
            log.info("Use Case generation {} is no longer PROCESSING; current status is {}.", generationId, staging.getStatus());
            return;
        }

        try {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new RuntimeException("Project not found with ID: " + projectId));

            // ── CACHE CHECK: tính fingerprint trước, nếu khớp với CONFIRMED cũ → reuse (fake delay) ──
            sendProgress(userId, 1, "Building Generation Context...");
            org.example.backend.dto.ai.UseCaseGenerationContext ctx = 
                useCaseGenerationContextBuilder.buildContext(project, request.getModuleId(), request.getRequirementIds());
            String fingerprint = useCaseGenerationFingerprintService.generateFingerprint(
                ctx, request.getGenerationMode().name(), request.getAllowProposedActors(), request.getRegenerateMissingOnly());

            java.util.Optional<AiGenerationStaging> cachedStaging = stagingRepository
                .findFirstByFileHashAndProjectIdAndStageAndStatusOrderByCreatedAtDesc(
                    fingerprint, projectId, AiStage.USE_CASE, AiGenerationStatus.CONFIRMED);

            if (cachedStaging.isPresent() && cachedStaging.get().getPayload() != null) {
                log.info("UC generation {} matched cached fingerprint. Restoring from cache.", generationId);
                sendProgress(userId, 2, "Cache hit! Verifying previous results...");
                try { Thread.sleep(3000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                sendProgress(userId, 4, "Rebuilding use case structure...");
                try { Thread.sleep(4000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                sendProgress(userId, 6, "Restoring previous AI results...");
                try { Thread.sleep(3000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

                boolean success = aiGenerationStagingService.updateStatusAndPayloadIf(
                    generationId,
                    AiGenerationStatus.PROCESSING,
                    AiGenerationStatus.PENDING,
                    cachedStaging.get().getPayload(),
                    fingerprint
                );
                if (success) sendProgress(userId, 7, "Done!");
                return;
            }
            // ── END CACHE CHECK ──

            UseCaseGenerationBuildResult result = buildUseCaseGenerationPayload(project, request, userId, ctx, fingerprint);

            boolean success = aiGenerationStagingService.updateStatusAndPayloadIf(
                    generationId, 
                    AiGenerationStatus.PROCESSING, 
                    AiGenerationStatus.PENDING, 
                    result.payload(), 
                    result.cacheFingerprint()
            );
            
            if (success) {
                sendProgress(userId, 7, "Done!");
            } else {
                log.warn("Failed to atomic update status to PENDING for generation {}", generationId);
            }
        } catch (Exception e) {
            log.error("Use Case generation {} failed.", generationId, e);
            ObjectNode errorPayload = objectMapper.createObjectNode();
            errorPayload.put("status", "FAILED");
            errorPayload.put("message", "Use case generation failed. Please try again.");
            errorPayload.put("error", e.getMessage());
            
            aiGenerationStagingService.updateStatusAndPayloadIf(
                    generationId, 
                    AiGenerationStatus.PROCESSING, 
                    AiGenerationStatus.DISCARDED, 
                    errorPayload, 
                    null
            );
            sendProgress(userId, 7, "Use Case generation failed.");
        }
    }

    private UseCaseGenerationBuildResult buildUseCaseGenerationPayload(Project project, org.example.backend.dto.AiUseCaseGenerateRequest request, Long userId) {
        sendProgress(userId, 1, "Building Generation Context...");
        org.example.backend.dto.ai.UseCaseGenerationContext context = useCaseGenerationContextBuilder.buildContext(project, request.getModuleId(), request.getRequirementIds());
        return buildUseCaseGenerationPayload(project, request, userId, context, null);
    }

    private UseCaseGenerationBuildResult buildUseCaseGenerationPayload(Project project, org.example.backend.dto.AiUseCaseGenerateRequest request, Long userId,
            org.example.backend.dto.ai.UseCaseGenerationContext context, String precomputedFingerprint) {

        // GAP ANALYSIS FILTERING
        if (Boolean.TRUE.equals(request.getRegenerateMissingOnly())) {
            List<Requirement> filtered = gapAnalysisService.filterRequirementsForGeneration(context.getModuleRequirements(), context.getExistingUseCases(), true);
            if (filtered.isEmpty()) {
                throw new RuntimeException("All selected requirements already have use cases, and regenerateMissingOnly is true.");
            }
            context.setModuleRequirements(filtered);
        }

        sendProgress(userId, 2, "Checking Cache...");
        String cacheFingerprint = precomputedFingerprint != null ? precomputedFingerprint
            : useCaseGenerationFingerprintService.generateFingerprint(context, request.getGenerationMode().name(), request.getAllowProposedActors(), request.getRegenerateMissingOnly());

        if (org.example.backend.dto.AiUseCaseGenerateRequest.GenerationMode.AUTO_PROJECT.equals(request.getGenerationMode())) {
            return buildAutoProjectPayload(context, request, userId, cacheFingerprint);
        }

        if (org.example.backend.dto.AiUseCaseGenerateRequest.GenerationMode.AUTO_PROJECT_MODULES_ONLY.equals(request.getGenerationMode())) {
            return buildModulePlanPayload(context, request, userId, cacheFingerprint);
        }

        // ---- Standard MODULE mode ----
        sendProgress(userId, 4, "AI Phase 1b: Discovering Actors and Goals...");
        org.example.backend.dto.ai.ActorDiscoveryResult discoveryResult = actorDiscoveryService.discoverActorsAndGoals(context, request.getAllowProposedActors());

        sendProgress(userId, 5, "Planning Generation Batches...");
        List<List<org.example.backend.dto.ai.ActorGoal>> chunks = useCasePlanningService.chunkGoalsForGeneration(discoveryResult);

        sendProgress(userId, 6, "AI Phase 2: Generating Detailed Use Cases...");
        List<List<org.example.backend.dto.ai.GeneratedUseCaseDraft>> generatedChunks = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            sendProgress(userId, 6, "Generating batch " + (i + 1) + " of " + chunks.size() + "...");
            generatedChunks.add(detailedUseCaseGenerationService.generateForChunk(context, chunks.get(i)));
        }

        sendProgress(userId, 7, "Reconciling and Validating Results...");
        List<org.example.backend.dto.ai.GeneratedUseCaseDraft> finalUseCases = useCaseReconciliationService.reconcile(generatedChunks);

        org.example.backend.dto.ai.UseCaseGenerationPayload payload = new org.example.backend.dto.ai.UseCaseGenerationPayload();
        payload.setSchemaVersion("2.0");
        payload.setGenerationMode(request.getGenerationMode().name());
        payload.setPromptVersion(org.example.backend.service.ai.usecase.UseCaseGenerationFingerprintService.PROMPT_VERSION);
        payload.setExistingActorsUsed(discoveryResult.getExistingActorsUsed());
        payload.setProposedActors(discoveryResult.getProposedActors());
        payload.setActorGoalMatrix(discoveryResult.getActorGoalMatrix());
        payload.setUseCases(finalUseCases);

        actorReferenceMergeService.mergeAndRemap(payload);
        payload.setCoverage(useCaseCoverageService.calculateCoverage(context, discoveryResult, finalUseCases));

        org.example.backend.dto.ai.UseCaseValidationResult validation = useCaseGenerationValidator.validate(payload);
        payload.setValidationSummary(validation);

        return new UseCaseGenerationBuildResult(objectMapper.valueToTree(payload), cacheFingerprint);
    }

    /**
     * AUTO_PROJECT mode: nếu project đã có modules trong DB → dùng luôn, không discover lại.
     * Chỉ discover khi project chưa có module nào.
     */
    private UseCaseGenerationBuildResult buildAutoProjectPayload(
            org.example.backend.dto.ai.UseCaseGenerationContext baseContext,
            org.example.backend.dto.AiUseCaseGenerateRequest request,
            Long userId,
            String cacheFingerprint) {

        List<org.example.backend.dto.ai.GeneratedModuleDraft> modules;

        // Nếu project đã có modules trong DB → map sang GeneratedModuleDraft (không discover lại)
        List<org.example.backend.entity.BusinessModule> existingDbModules = baseContext.getProjectModules();
        if (existingDbModules != null && !existingDbModules.isEmpty()) {
            sendProgress(userId, 3, "Using existing " + existingDbModules.size() + " modules from project...");
            // Build req ID set for fast lookup
            java.util.Set<Long> reqIdSet = baseContext.getModuleRequirements().stream()
                    .map(org.example.backend.entity.Requirement::getId)
                    .collect(java.util.stream.Collectors.toSet());

            modules = existingDbModules.stream().map(m -> {
                org.example.backend.dto.ai.GeneratedModuleDraft draft = new org.example.backend.dto.ai.GeneratedModuleDraft();
                draft.setTemporaryId("MODULE-DB-" + m.getId());
                draft.setName(m.getName());
                draft.setDescription(m.getDescription());
                draft.setPriority(m.getPriority() != null ? m.getPriority() : "MEDIUM");
                draft.setExistingModuleId(m.getId()); // ← đảm bảo backend dùng đúng module DB
                // Map requirements đã thuộc module này
                List<Long> modReqIds = baseContext.getModuleRequirements().stream()
                        .filter(r -> r.getBusinessModule() != null && r.getBusinessModule().getId().equals(m.getId()))
                        .map(org.example.backend.entity.Requirement::getId)
                        .collect(java.util.stream.Collectors.toList());
                draft.setRequirementIds(modReqIds);
                return draft;
            }).collect(java.util.stream.Collectors.toList());

            // Requirements chưa có module → gom vào một draft "General"
            List<Long> unassignedReqIds = baseContext.getModuleRequirements().stream()
                    .filter(r -> r.getBusinessModule() == null)
                    .map(org.example.backend.entity.Requirement::getId)
                    .collect(java.util.stream.Collectors.toList());
            if (!unassignedReqIds.isEmpty()) {
                org.example.backend.dto.ai.GeneratedModuleDraft general = new org.example.backend.dto.ai.GeneratedModuleDraft();
                general.setTemporaryId("MODULE-GENERAL");
                general.setName("General Module");
                general.setDescription("Unassigned requirements");
                general.setPriority("MEDIUM");
                general.setRequirementIds(unassignedReqIds);
                modules.add(general);
            }
        } else {
            sendProgress(userId, 3, "AI Phase 1a: Discovering Business Modules...");
            org.example.backend.dto.ai.ModuleDiscoveryResult moduleDiscoveryResult = moduleDiscoveryService.discoverModules(baseContext);
            modules = moduleDiscoveryResult.getModules();
        }

        List<org.example.backend.dto.ai.GeneratedUseCaseDraft> allUseCases = new ArrayList<>();
        List<org.example.backend.dto.ai.DiscoveredActor> allExistingActors = new ArrayList<>();
        List<org.example.backend.dto.ai.DiscoveredActor> allProposedActors = new ArrayList<>();
        List<org.example.backend.dto.ai.ActorGoal> allGoals = new ArrayList<>();

        // Build req ID -> Requirement map for fast lookup
        Map<Long, Requirement> reqById = new HashMap<>();
        for (Requirement r : baseContext.getModuleRequirements()) {
            reqById.put(r.getId(), r);
        }

        int totalModules = modules.size();

        for (int modIdx = 0; modIdx < totalModules; modIdx++) {
            org.example.backend.dto.ai.GeneratedModuleDraft moduleDraft = modules.get(modIdx);
            sendProgress(userId, 4, "Processing module " + (modIdx + 1) + "/" + totalModules + ": " + moduleDraft.getName());

            // Build requirements list for this module
            List<Requirement> moduleReqs = new ArrayList<>();
            if (moduleDraft.getRequirementIds() != null) {
                for (Long rid : moduleDraft.getRequirementIds()) {
                    Requirement r = reqById.get(rid);
                    if (r != null) moduleReqs.add(r);
                }
            }
            if (moduleReqs.isEmpty()) continue;

            // Build per-module context (focused: only this module's requirements)
            org.example.backend.dto.ai.UseCaseGenerationContext moduleContext = org.example.backend.dto.ai.UseCaseGenerationContext.builder()
                    .project(baseContext.getProject())
                    .targetModule(null) // no DB module yet, using draft
                    .moduleRequirements(moduleReqs)
                    .existingActors(baseContext.getExistingActors())
                    .existingUseCases(baseContext.getExistingUseCases())
                    .contextPriorities(java.util.List.of())
                    .projectModules(baseContext.getProjectModules())
                    .generatedModule(moduleDraft)
                    .build();

            // Actor discovery per module (focused context → better goals)
            org.example.backend.dto.ai.ActorDiscoveryResult moduleDiscovery =
                    actorDiscoveryService.discoverActorsAndGoals(moduleContext, request.getAllowProposedActors());

            // Collect actors
            if (moduleDiscovery.getExistingActorsUsed() != null) allExistingActors.addAll(moduleDiscovery.getExistingActorsUsed());
            if (moduleDiscovery.getProposedActors() != null) allProposedActors.addAll(moduleDiscovery.getProposedActors());

            // Collect goals (with module ref injected)
            if (moduleDiscovery.getActorGoalMatrix() != null) {
                for (org.example.backend.dto.ai.ActorGoal goal : moduleDiscovery.getActorGoalMatrix()) {
                    allGoals.add(goal);
                }
            }

            // UC generation per module in chunks
            List<List<org.example.backend.dto.ai.ActorGoal>> chunks = useCasePlanningService.chunkGoalsForGeneration(moduleDiscovery);
            for (int i = 0; i < chunks.size(); i++) {
                sendProgress(userId, 5, "Generating UCs for " + moduleDraft.getName() + " batch " + (i + 1) + "/" + chunks.size());
                List<org.example.backend.dto.ai.GeneratedUseCaseDraft> batchUcs =
                        detailedUseCaseGenerationService.generateForChunk(moduleContext, chunks.get(i));

                // Stamp every UC with moduleRef and moduleName
                for (org.example.backend.dto.ai.GeneratedUseCaseDraft uc : batchUcs) {
                    uc.setModuleRef(moduleDraft.getTemporaryId());
                    uc.setModuleName(moduleDraft.getName());
                }
                allUseCases.addAll(batchUcs);
            }
        }

        sendProgress(userId, 6, "Reconciling and Validating Results...");
        List<org.example.backend.dto.ai.GeneratedUseCaseDraft> finalUseCases = useCaseReconciliationService.reconcile(
                java.util.List.of(allUseCases));

        org.example.backend.dto.ai.UseCaseGenerationPayload payload = new org.example.backend.dto.ai.UseCaseGenerationPayload();
        payload.setSchemaVersion("3.0");
        payload.setGenerationMode(request.getGenerationMode().name());
        payload.setPromptVersion(org.example.backend.service.ai.usecase.UseCaseGenerationFingerprintService.PROMPT_VERSION);
        payload.setExistingActorsUsed(allExistingActors);
        payload.setProposedActors(allProposedActors);
        payload.setActorGoalMatrix(allGoals);
        payload.setUseCases(finalUseCases);
        payload.setModules(modules);

        actorReferenceMergeService.mergeAndRemap(payload);

        org.example.backend.dto.ai.UseCaseCoverageReport coverage = gapAnalysisService.generateGlobalCoverageReport(payload, baseContext.getModuleRequirements());
        payload.setCoverage(coverage);
        payload.setModuleCoverage(gapAnalysisService.generateModuleCoverageReports(payload, baseContext.getModuleRequirements()));

        org.example.backend.dto.ai.UseCaseValidationResult validation = useCaseGenerationValidator.validate(payload);
        payload.setValidationSummary(validation);

        return new UseCaseGenerationBuildResult(objectMapper.valueToTree(payload), cacheFingerprint);
    }

    /**
     * AUTO_PROJECT_MODULES_ONLY: cluster requirements into modules, suggest assignees, no UC generation.
     * Leader reviews the module plan, edits assignees, then approves to create BusinessModules.
     */
    private UseCaseGenerationBuildResult buildModulePlanPayload(
            org.example.backend.dto.ai.UseCaseGenerationContext baseContext,
            org.example.backend.dto.AiUseCaseGenerateRequest request,
            Long userId,
            String cacheFingerprint) {

        sendProgress(userId, 3, "AI: Discovering and clustering Business Modules...");
        org.example.backend.dto.ai.ModuleDiscoveryResult moduleDiscoveryResult =
                moduleDiscoveryService.discoverModules(baseContext);

        List<org.example.backend.dto.ai.GeneratedModuleDraft> modules = moduleDiscoveryResult.getModules();

        // Auto-assign members: distribute modules round-robin across non-leader project members
        List<org.example.backend.entity.ProjectMember> members = projectMemberRepository.findByProjectId(
                baseContext.getProject().getId());
        // Filter to non-leader members (they do the work)
        List<org.example.backend.entity.ProjectMember> assignableMembers = members.stream()
                .filter(m -> m.getRole() != null && !m.getRole().getName().toUpperCase().contains("LEADER"))
                .collect(java.util.stream.Collectors.toList());

        // If no non-leader members, use all members
        if (assignableMembers.isEmpty()) {
            assignableMembers = new java.util.ArrayList<>(members);
        }

        if (!assignableMembers.isEmpty()) {
            for (int i = 0; i < modules.size(); i++) {
                org.example.backend.entity.ProjectMember assignedMember =
                        assignableMembers.get(i % assignableMembers.size());
                org.example.backend.entity.UserAccount user = assignedMember.getUser();
                if (user != null) {
                    // Load user eagerly bằng ID để tránh LazyInitializationException
                    // (assignedMember.getUser() có thể là Hibernate proxy chưa init)
                    org.example.backend.entity.UserAccount loadedUser = userRepository.findById(user.getId()).orElse(null);
                    if (loadedUser != null) {
                        modules.get(i).setSuggestedAssigneeId(loadedUser.getId());
                        modules.get(i).setSuggestedAssigneeName(
                                loadedUser.getUsername() != null ? loadedUser.getUsername() : loadedUser.getEmail());
                    }
                }
            }
        }

        sendProgress(userId, 8, "Module plan ready for review...");

        // Build a lightweight payload — no UCs, just modules
        org.example.backend.dto.ai.UseCaseGenerationPayload payload = new org.example.backend.dto.ai.UseCaseGenerationPayload();
        payload.setSchemaVersion("modules-only");
        payload.setGenerationMode(request.getGenerationMode().name());
        payload.setPromptVersion(org.example.backend.service.ai.usecase.UseCaseGenerationFingerprintService.PROMPT_VERSION);
        payload.setModules(modules);
        payload.setUseCases(new java.util.ArrayList<>());
        payload.setExistingActorsUsed(new java.util.ArrayList<>());
        payload.setProposedActors(new java.util.ArrayList<>());
        payload.setActorGoalMatrix(new java.util.ArrayList<>());

        return new UseCaseGenerationBuildResult(objectMapper.valueToTree(payload), cacheFingerprint);
    }

    private record UseCaseGenerationBuildResult(JsonNode payload, String cacheFingerprint) {}

    @Transactional
    public UUID generateUseCasesV2(Long projectId, org.example.backend.dto.AiUseCaseGenerateRequest request, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án với ID: " + projectId));

        if (request.getRequirementIds() == null || request.getRequirementIds().isEmpty()) {
            throw new RuntimeException("Danh sách Requirement không được để trống.");
        }

        sendProgress(userId, 0, "Building Generation Context...");
        org.example.backend.dto.ai.UseCaseGenerationContext context = useCaseGenerationContextBuilder.buildContext(project, request.getModuleId(), request.getRequirementIds());

        sendProgress(userId, 1, "Checking Cache...");
        String cacheFingerprint = useCaseGenerationFingerprintService.generateFingerprint(context, request.getGenerationMode().name(), request.getAllowProposedActors(), request.getRegenerateMissingOnly());
        // TODO: check stagingRepository for existing cache

        sendProgress(userId, 2, "AI Phase 1: Discovering Actors and Goals...");
        org.example.backend.dto.ai.ActorDiscoveryResult discoveryResult = actorDiscoveryService.discoverActorsAndGoals(context, request.getAllowProposedActors());

        sendProgress(userId, 3, "Planning Generation Batches...");
        List<List<org.example.backend.dto.ai.ActorGoal>> chunks = useCasePlanningService.chunkGoalsForGeneration(discoveryResult);

        sendProgress(userId, 4, "AI Phase 2: Generating Detailed Use Cases...");
        List<List<org.example.backend.dto.ai.GeneratedUseCaseDraft>> generatedChunks = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            sendProgress(userId, 4, "Generating batch " + (i + 1) + " of " + chunks.size() + "...");
            generatedChunks.add(detailedUseCaseGenerationService.generateForChunk(context, chunks.get(i)));
        }

        sendProgress(userId, 5, "Reconciling and Validating Results...");
        List<org.example.backend.dto.ai.GeneratedUseCaseDraft> finalUseCases = useCaseReconciliationService.reconcile(generatedChunks);
        org.example.backend.dto.ai.UseCaseCoverageReport coverage = useCaseCoverageService.calculateCoverage(context, discoveryResult, finalUseCases);
        
        org.example.backend.dto.ai.UseCaseGenerationPayload payload = new org.example.backend.dto.ai.UseCaseGenerationPayload();
        payload.setSchemaVersion("2.0");
        payload.setGenerationMode(request.getGenerationMode().name());
        payload.setPromptVersion(org.example.backend.service.ai.usecase.UseCaseGenerationFingerprintService.PROMPT_VERSION);
        payload.setExistingActorsUsed(discoveryResult.getExistingActorsUsed());
        payload.setProposedActors(discoveryResult.getProposedActors());
        payload.setActorGoalMatrix(discoveryResult.getActorGoalMatrix());
        payload.setUseCases(finalUseCases);
        payload.setCoverage(coverage);

        org.example.backend.dto.ai.UseCaseValidationResult validation = useCaseGenerationValidator.validate(payload);
        payload.setValidationSummary(validation);

        sendProgress(userId, 6, "Saving Draft...");
        UUID generationId = UUID.randomUUID();
        
        JsonNode jsonPayload = objectMapper.valueToTree(payload);
        
        AiGenerationStaging staging = AiGenerationStaging.builder()
                .project(project)
                .generationId(generationId)
                .stage(AiStage.USE_CASE)
                .payload(jsonPayload)
                .fileHash(cacheFingerprint)
                .status(AiGenerationStatus.PENDING)
                .build();

        stagingRepository.save(staging);

        sendProgress(userId, 7, "Done!");
        return generationId;
    }

    @Transactional
    public UUID generateUseCases(Long projectId, List<Long> requirementIds, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án với ID: " + projectId));

        if (requirementIds == null || requirementIds.isEmpty()) {
            throw new RuntimeException("Danh sách Requirement không được để trống.");
        }

        sendProgress(userId, 0, "Fetching requirement details...");
        List<Requirement> reqs = requirementRepository.findAllById(requirementIds);
        if (reqs.isEmpty()) {
            throw new RuntimeException("Không tìm thấy Requirement nào hợp lệ.");
        }
        for (Requirement req : reqs) {
            if (!req.getProject().getId().equals(projectId)) {
                throw new RuntimeException("Requirement ID " + req.getId() + " không thuộc dự án này.");
            }
        }

        sendProgress(userId, 1, "Fetching ecosystem context (Actors and Existing Use Cases)...");
        List<org.example.backend.entity.ProjectActor> dbActors = projectActorRepository.findByProjectId(projectId);
        java.util.Set<String> actorNames = new java.util.LinkedHashSet<>(dbActors.stream().map(org.example.backend.entity.ProjectActor::getName).toList());
        // Also include actors from any PENDING or CONFIRMED REQ staging (actors added during review but not yet approved)
        try {
            List<AiGenerationStaging> reqStagings = stagingRepository.findByProjectIdAndStageAndStatusOrderByCreatedAtDesc(projectId, AiStage.REQUIREMENT, AiGenerationStatus.PENDING);
            for (AiGenerationStaging rs : reqStagings) {
                JsonNode rPayload = rs.getPayload();
                if (rPayload != null) {
                    JsonNode actorsArr = rPayload.isObject() && rPayload.has("project_actors") ? rPayload.get("project_actors")
                            : (rPayload.isArray() && rPayload.size() > 0 && rPayload.get(0).has("project_actors") ? rPayload.get(0).get("project_actors") : null);
                    if (actorsArr != null && actorsArr.isArray()) {
                        for (JsonNode an : actorsArr) {
                            String aName = an.has("name") ? an.get("name").asText().trim() : an.asText().trim();
                            if (!aName.isEmpty()) actorNames.add(aName);
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        List<String> projectActors = new java.util.ArrayList<>(actorNames);
        
        List<org.example.backend.entity.UseCase> dbUseCases = useCaseRepository.findByProjectId(projectId);
        List<String> existingUseCases = dbUseCases.stream()
                .map(uc -> uc.getCode() != null ? uc.getCode() + ": " + uc.getName() : uc.getName())
                .toList();

        sendProgress(userId, 2, "Checking cache for existing Use Cases...");
        String reqIdsStr = reqs.stream().map(r -> r.getReqCode() != null ? r.getReqCode() : String.valueOf(r.getId())).sorted().collect(java.util.stream.Collectors.joining(","));
        String stagingHash = org.springframework.util.DigestUtils.md5DigestAsHex(reqIdsStr.getBytes());
        java.util.Optional<AiGenerationStaging> existingCache = stagingRepository.findFirstByFileHashAndProjectIdAndStageOrderByCreatedAtDesc(stagingHash, projectId, AiStage.USE_CASE);

        if (dbUseCases.isEmpty() && existingCache.isPresent() && 
            (existingCache.get().getStatus() == AiGenerationStatus.CONFIRMED || 
             existingCache.get().getStatus() == AiGenerationStatus.PENDING || 
             existingCache.get().getStatus() == AiGenerationStatus.DISCARDED) &&
             existingCache.get().getPayload() != null &&
             existingCache.get().getPayload().isArray() &&
             existingCache.get().getPayload().size() > 0 &&
             existingCache.get().getPayload().get(0).has("quality_status")) {
            AiGenerationStaging oldStaging = existingCache.get();
            UUID generationId = UUID.randomUUID();
            AiGenerationStaging newStaging = AiGenerationStaging.builder()
                    .project(project)
                    .stage(AiStage.USE_CASE)
                    .generationId(generationId)
                    .payload(oldStaging.getPayload())
                    .fileHash(stagingHash)
                    .status(AiGenerationStatus.PENDING)
                    .build();
            stagingRepository.save(newStaging);
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    Thread.sleep(10000); // Synchronous fake AI delay (10s) so frontend shows loading
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                sendProgress(userId, 5, "Done!");
            });
            
            return generationId;
        }

        sendProgress(userId, 2, "AI is analyzing requirements and generating Use Cases...");
        // Fetch member usernames to pass to AI, avoiding project.setMembers() which breaks orphanRemoval
        java.util.List<String> projectMemberUsernames = projectMemberRepository.findByProjectIdWithUsers(projectId).stream()
                .filter(pm -> pm.getUser() != null)
                .map(pm -> pm.getUser().getUsername())
                .distinct()
                .collect(java.util.stream.Collectors.toList());
        java.util.List<String> existingModuleNames = businessModuleRepository.findByProjectId(projectId).stream()
                .map(org.example.backend.entity.BusinessModule::getName)
                .collect(java.util.stream.Collectors.toList());

        String rawJsonResponse = useCaseGeminiService.generateUseCasesFromRequirements(reqs, projectActors, existingUseCases, project, projectMemberUsernames, existingModuleNames);

        sendProgress(userId, 2, "Parsing AI results...");
        JsonNode payload;
        try {
            payload = objectMapper.readTree(rawJsonResponse);
            if (!payload.isArray()) {
                // Thử tìm mảng trong các object key
                boolean foundArray = false;
                if (payload.isObject()) {
                    for (JsonNode child : payload) {
                        if (child.isArray()) {
                            payload = child;
                            foundArray = true;
                            break;
                        }
                    }
                }
                if (!foundArray) {
                    log.error("Gemini did not return a valid JSON array for Use Cases. Response: {}", rawJsonResponse);
                    throw new RuntimeException("Gemini không trả về danh sách JSON hợp lệ.");
                }
            }
            
            // Fix hallucinated Requirement IDs & Inject requirementCode
            if (payload.isArray()) {
                if (reqs.size() == 1) {
                    Long actualReqId = reqs.get(0).getId();
                    for (JsonNode node : payload) {
                        if (node.isObject()) {
                            com.fasterxml.jackson.databind.node.ArrayNode arr = ((com.fasterxml.jackson.databind.node.ObjectNode) node).putArray("requirementIds");
                            arr.add(actualReqId);
                        }
                    }
                } else {
                    java.util.Set<Long> validReqIds = reqs.stream().map(Requirement::getId).collect(java.util.stream.Collectors.toSet());
                    for (JsonNode node : payload) {
                        if (node.isObject() && node.has("requirementIds") && node.get("requirementIds").isArray()) {
                            com.fasterxml.jackson.databind.node.ArrayNode arr = (com.fasterxml.jackson.databind.node.ArrayNode) node.get("requirementIds");
                            for (int i = arr.size() - 1; i >= 0; i--) {
                                if (!validReqIds.contains(arr.get(i).asLong())) {
                                    arr.remove(i);
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error parsing Gemini JSON for Use Cases: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi đọc kết quả từ AI. Vui lòng thử lại.");
        }

        sendProgress(userId, 3, "AI Critic is reviewing the Use Cases...");
        String evaluatedJson = useCaseGeminiService.evaluateUseCasesWithCritic(payload.toString(), reqs, existingUseCases, projectActors);
        
        sendProgress(userId, 4, "Saving draft Use Cases to staging...");
        JsonNode finalPayload;
        try {
            finalPayload = objectMapper.readTree(evaluatedJson);
            if (finalPayload == null || finalPayload.isMissingNode()) {
                finalPayload = payload;
            }
        } catch (Exception e) {
            log.warn("Failed to parse evaluated JSON, falling back to raw payload");
            finalPayload = payload;
        }

        UUID generationId = UUID.randomUUID();
        AiGenerationStaging staging = AiGenerationStaging.builder()
                .project(project)
                .generationId(generationId)
                .stage(AiStage.USE_CASE)
                .payload(finalPayload)
                .fileHash(stagingHash)
                .status(AiGenerationStatus.PENDING)
                .build();

        stagingRepository.save(staging);

        sendProgress(userId, 5, "Done!");
        return generationId;
    }

    public Map<String, Object> getGenerationById(UUID generationId) {
        List<AiGenerationStaging> stagings = stagingRepository.findByGenerationId(generationId);
        if (stagings.isEmpty()) {
            throw new RuntimeException("Không tìm thấy dữ liệu staging với ID: " + generationId);
        }
        AiGenerationStaging staging = stagings.get(0);

        Map<String, Object> map = new HashMap<>();
        map.put("id", staging.getId());
        map.put("project", staging.getProject().getId());
        map.put("stage", staging.getStage().name());
        
        // Fix Jackson serializing JsonNode as POJO
        try {
            if (staging.getPayload() != null) {
                Object payloadObj = objectMapper.treeToValue(staging.getPayload(), Object.class);
                map.put("payload", payloadObj);
            } else {
                map.put("payload", new ArrayList<>());
            }
        } catch (Exception e) {
            map.put("payload", staging.getPayload() != null ? staging.getPayload().toString() : "[]");
        }
        
        map.put("status", staging.getStatus().name());
        map.put("createdAt", staging.getCreatedAt());

        return map;
    }

    @Transactional
    public void regenerateRequirements(UUID generationId, Long userId) {
        List<AiGenerationStaging> stagings = stagingRepository.findByGenerationId(generationId);
        if (stagings.isEmpty()) {
            throw new RuntimeException("Không tìm thấy dữ liệu staging với ID: " + generationId);
        }

        AiGenerationStaging staging = stagings.get(0);
        if (staging.getStatus() != AiGenerationStatus.PENDING) {
            throw new RuntimeException("Dữ liệu này đã được duyệt hoặc bị từ chối, không thể tạo lại.");
        }

        String documentText = staging.getDocumentText();
        if (documentText == null || documentText.isEmpty()) {
            throw new RuntimeException("Không tìm thấy dữ liệu văn bản gốc để phân tích lại.");
        }

        sendProgress(userId, 1, "AI is analyzing and extracting requirements (Regenerating)...");

        // Re-evaluate context warning in case project baseline has changed
        String contextWarning = null;
        List<org.example.backend.entity.Requirement> contextReqs = requirementRepository.findTop10ByProjectIdAndIsDeletedFalseOrderByCreatedAtDesc(staging.getProject().getId());
        List<String> contextStrings = new ArrayList<>();
        for (org.example.backend.entity.Requirement r : contextReqs) {
            contextStrings.add(r.getTitle() + (r.getDescription() != null ? ": " + r.getDescription() : ""));
        }
        String evalJson = requirementGeminiService.evaluateDocumentContext(contextStrings, documentText);
        try {
            JsonNode evalNode = objectMapper.readTree(evalJson);
            int score = evalNode.has("relevanceScore") ? evalNode.get("relevanceScore").asInt() : 100;
            String reason = evalNode.has("reason") ? evalNode.get("reason").asText() : "";
            if (score <= 30) {
                throw new org.example.backend.exception.BusinessException("Document rejected due to context mismatch with the project (Relevance score: " + score + "%). Reason: " + reason);
            } else if (score < 100) {
                contextWarning = reason;
            }
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("Failed to parse context evaluation JSON: {}", evalJson);
        }
        staging.setContextWarning(contextWarning);

        // Call Gemini API again (bypassing cache)
        String rawJsonResponse = requirementGeminiService.extractRequirementsFromText(documentText, staging.getProject());
        
        JsonNode reqsArray;
        JsonNode actorsArray;
        try {
            JsonNode rawNode = objectMapper.readTree(rawJsonResponse);
            reqsArray = rawNode.has("requirements") ? rawNode.get("requirements") : rawNode;
            actorsArray = rawNode.has("project_actors") ? rawNode.get("project_actors") : objectMapper.createArrayNode();
        } catch (Exception e) {
            log.error("Error parsing raw JSON: {}", e.getMessage());
            throw new RuntimeException("Lỗi khi đọc kết quả thô từ AI.");
        }

        sendProgress(userId, 2, "AI Critic is reviewing requirement quality and checking semantics duplicates...");
        String criticizedJsonResponse = requirementGeminiService.evaluateRequirementsWithCritic(reqsArray.toString(), documentText, contextStrings);

        sendProgress(userId, 3, "Finalizing results and updating database...");
        JsonNode newPayload;
        try {
            JsonNode criticizedNode = objectMapper.readTree(criticizedJsonResponse);
            if (criticizedNode.isObject() && criticizedNode.has("requirements")) {
                criticizedNode = criticizedNode.get("requirements");
            }
            if (!criticizedNode.isArray()) {
                log.error("Gemini did not return a valid JSON array during regeneration. Response: {}", criticizedJsonResponse);
                throw new RuntimeException("Gemini không trả về danh sách JSON hợp lệ.");
            }
            
            com.fasterxml.jackson.databind.node.ObjectNode finalPayload = objectMapper.createObjectNode();
            finalPayload.set("project_actors", actorsArray);
            finalPayload.set("requirements", criticizedNode);
            newPayload = finalPayload;
        } catch (Exception e) {
            log.error("Error parsing regenerated JSON: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi đọc kết quả phân tích lại. Vui lòng thử lại.");
        }

        staging.setPayload(newPayload);
        stagingRepository.save(staging);

        sendProgress(userId, 4, "Done regenerating!");
    }

    private void sendProgress(Long userId, int step, String message) {
        if (userId == null) return;
        try {
            String payload = String.format("{\"type\":\"AI_PROGRESS\",\"data\":{\"step\":%d,\"message\":\"%s\"}}", step, message);
            NotificationWebSocketHandler.sendToUser(userId, payload);
        } catch (Exception e) {
            // Ignore websocket errors to not break the flow
        }
    }

    @Transactional
    public void deletePendingGenerations(Long projectId, AiStage stage) {
        List<AiGenerationStaging> pending = stagingRepository.findByProjectIdAndStageAndStatusOrderByCreatedAtDesc(projectId, stage, AiGenerationStatus.PENDING);
        List<AiGenerationStaging> processing = stagingRepository.findByProjectIdAndStageAndStatusOrderByCreatedAtDesc(projectId, stage, AiGenerationStatus.PROCESSING);
        pending.addAll(processing);
        for (AiGenerationStaging s : pending) {
            s.setStatus(AiGenerationStatus.DISCARDED);
        }
        stagingRepository.saveAll(pending);
    }

    @Transactional
    public void cancelGeneration(UUID generationId, Long userId) {
        List<AiGenerationStaging> stagings = stagingRepository.findByGenerationId(generationId);
        if (stagings.isEmpty()) {
            throw new BusinessException("Generation not found");
        }
        AiGenerationStaging staging = stagings.get(0);
        if (staging.getStatus() == AiGenerationStatus.CONFIRMED || staging.getStatus() == AiGenerationStatus.DISCARDED) {
            throw new BusinessException("Cannot cancel generation that is already " + staging.getStatus());
        }
        
        ObjectNode cancelPayload = objectMapper.createObjectNode();
        cancelPayload.put("status", "CANCELLED");
        cancelPayload.put("message", "Generation was cancelled by user.");
        
        aiGenerationStagingService.updateStatusAndPayloadIf(
                generationId, 
                staging.getStatus(), 
                AiGenerationStatus.DISCARDED, 
                cancelPayload, 
                staging.getFileHash()
        );
        sendProgress(userId, 7, "Generation cancelled.");
    }

    public List<AiGenerationStaging> getPendingGenerations(Long projectId, org.example.backend.entity.AiStage stage) {
        return stagingRepository.findByProjectIdAndStageAndStatusOrderByCreatedAtDesc(projectId, stage, AiGenerationStatus.PENDING);
    }

    public Map<String, Object> getLastPayloadDebug() {
        return stagingRepository.findAll().stream()
                .max(java.util.Comparator.comparing(AiGenerationStaging::getCreatedAt))
                .map(s -> Map.of(
                        "id", s.getId(),
                        "generationId", s.getGenerationId(),
                        "payload", s.getPayload()
                ))
                .orElse(Map.of("message", "No records found"));
    }

    public List<Map<String, Object>> getPendingGenerationsWithDuplicateCheck(Long projectId, org.example.backend.entity.AiStage stage) {
        List<AiGenerationStaging> stagings = getPendingGenerations(projectId, stage);
        
        List<String> existingTitles = requirementRepository.findTitlesByProjectId(projectId);
        java.util.Set<String> lowerCaseTitles = existingTitles.stream().map(String::toLowerCase).collect(java.util.stream.Collectors.toSet());

        List<Map<String, Object>> responseList = new ArrayList<>();
        for (AiGenerationStaging staging : stagings) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", staging.getId());
            map.put("generationId", staging.getGenerationId());
            map.put("status", staging.getStatus());
            map.put("createdAt", staging.getCreatedAt());
            map.put("documentText", staging.getDocumentText());
            map.put("contextWarning", staging.getContextWarning());
            
            JsonNode stagingPayload = staging.getPayload();
            // Schema 3.0 (AUTO_PROJECT) uses "useCases" + "modules" instead of "requirements"
            // Schema 2.0 uses "requirements" array
            // Pass the raw payload to frontend for schema 3.0; only do duplicate-check for schema 2.0
            if (stagingPayload != null && stagingPayload.has("useCases")) {
                // Schema 3.0: pass entire payload as-is, frontend handles it
                map.put("payload", stagingPayload);
                map.put("schemaVersion", "3.0");
            } else {
                JsonNode reqsPayload = stagingPayload != null && stagingPayload.has("requirements") 
                    ? stagingPayload.get("requirements") 
                    : stagingPayload;
                List<Map<String, Object>> payloadList = null;
                if (reqsPayload != null && reqsPayload.isArray()) {
                    try {
                        payloadList = objectMapper.convertValue(reqsPayload, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
                    } catch (Exception ignored) { /* non-list payload, skip */ }
                }
                if (payloadList != null) {
                    for (Map<String, Object> item : payloadList) {
                        String title = (String) item.get("title");
                        if (title != null && lowerCaseTitles.contains(title.toLowerCase())) {
                            item.put("isDuplicate", true);
                        }
                    }
                }
                map.put("payload", payloadList);
            }
            if (stagingPayload != null && stagingPayload.has("project_actors")) {
                List<Map<String, Object>> actorsList = objectMapper.convertValue(stagingPayload.get("project_actors"), new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
                map.put("project_actors", actorsList);
            }
            responseList.add(map);
        }
        return responseList;
    }

    @Transactional
    public void approveGeneration(UUID generationId, List<Integer> selectedIndices, JsonNode modifiedPayload, Long userId) {
        List<AiGenerationStaging> stagings = stagingRepository.findByGenerationId(generationId);
        if (stagings.isEmpty()) {
            throw new RuntimeException("Không tìm thấy dữ liệu staging với ID: " + generationId);
        }

        AiGenerationStaging staging = stagings.get(0);
        if (staging.getStatus() != AiGenerationStatus.PENDING) {
            throw new RuntimeException("Dữ liệu này đã được duyệt hoặc bị từ chối.");
        }

        Project project = staging.getProject();
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với ID: " + userId));
        JsonNode stagingPayload = staging.getPayload();
        JsonNode payload = modifiedPayload != null && modifiedPayload.has("requirements") ? modifiedPayload.get("requirements") : (modifiedPayload != null ? modifiedPayload : (stagingPayload != null && stagingPayload.has("requirements") ? stagingPayload.get("requirements") : stagingPayload));
        
        Integer maxSubId = requirementRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        
        // Save actors if present in modifiedPayload, else fallback to stagingPayload
        JsonNode actorsNode = null;
        if (modifiedPayload != null && modifiedPayload.has("project_actors")) {
            actorsNode = modifiedPayload.get("project_actors");
        } else if (stagingPayload != null && stagingPayload.has("project_actors")) {
            actorsNode = stagingPayload.get("project_actors");
        }

        if (actorsNode != null && actorsNode.isArray()) {
            List<org.example.backend.entity.ProjectActor> existingActors = projectActorRepository.findByProjectId(project.getId());
            java.util.Set<String> existingNames = existingActors.stream()
                    .map(a -> a.getName().toLowerCase())
                    .collect(java.util.stream.Collectors.toSet());
            
            List<org.example.backend.entity.ProjectActor> actorsToSave = new ArrayList<>();
            for (JsonNode actorNode : actorsNode) {
                String name = actorNode.has("name") ? actorNode.get("name").asText() : "";
                String inheritsFrom = actorNode.has("inheritsFrom") ? actorNode.get("inheritsFrom").asText() : null;
                String desc = ""; // As requested, removing description
                if (!name.isEmpty() && !existingNames.contains(name.toLowerCase())) {
                    actorsToSave.add(org.example.backend.entity.ProjectActor.builder()
                            .project(project)
                            .name(name)
                            .inheritsFrom(inheritsFrom)
                            .description(desc)
                            .build());
                    existingNames.add(name.toLowerCase());
                }
            }
            if (!actorsToSave.isEmpty()) {
                projectActorRepository.saveAll(actorsToSave);
            }
        }
        
        List<Requirement> requirementsToSave = new ArrayList<>();
        
        for (int i = 0; i < payload.size(); i++) {
            if (selectedIndices == null || selectedIndices.contains(i)) {
                JsonNode reqNode = payload.get(i);
                
                String typeStr = reqNode.has("type") ? reqNode.get("type").asText().toUpperCase() : "FUNCTIONAL";
                RequirementType type;
                try {
                    type = RequirementType.valueOf(typeStr);
                } catch (IllegalArgumentException e) {
                    type = RequirementType.FUNCTIONAL;
                }
                
                String priorityStr = reqNode.has("priority") ? reqNode.get("priority").asText().toUpperCase() : "MEDIUM";
                Priority priority;
                try {
                    priority = Priority.valueOf(priorityStr);
                } catch (IllegalArgumentException e) {
                    priority = Priority.MEDIUM;
                }

                String acceptanceCriteria = "[]";
                if (reqNode.has("acceptanceCriteria")) {
                    acceptanceCriteria = reqNode.get("acceptanceCriteria").toString();
                }

                String title = reqNode.has("title") ? reqNode.get("title").asText() : "Untitled Requirement";
                String description = reqNode.has("description") ? reqNode.get("description").asText() : "";

                List<String> tagsList = new ArrayList<>();
                if (reqNode.has("tags") && reqNode.get("tags").isArray()) {
                    for (JsonNode tagNode : reqNode.get("tags")) {
                        tagsList.add(tagNode.asText());
                    }
                }

                Requirement req = Requirement.builder()
                        .project(project)
                        .title(title)
                        .description(description)
                        .tags(tagsList)
                        .type(type)
                        .priority(priority)
                        .acceptanceCriteria(acceptanceCriteria)
                        .startDate(reqNode.has("startDate") && !reqNode.get("startDate").isNull() && !reqNode.get("startDate").asText().equals("N/A") ? java.time.LocalDate.parse(reqNode.get("startDate").asText()) : project.getStartDate())
                        .deadline(reqNode.has("deadline") && !reqNode.get("deadline").isNull() && !reqNode.get("deadline").asText().equals("N/A") ? java.time.LocalDate.parse(reqNode.get("deadline").asText()) : project.getDeadline())
                        .status(org.example.backend.entity.RequirementStatus.DRAFT)
                        .projectSubId(nextSubId)
                        .reqCode("REQ-" + nextSubId)
                        .owner(user)
                        .createdBy(user)
                        .aiGenerated(true)
                        .sourceGenerationId(generationId)
                        .build();
                
                nextSubId++;
                requirementsToSave.add(req);
            }
        }

        requirementRepository.saveAll(requirementsToSave);
        
        for (Requirement req : requirementsToSave) {
            auditService.publishSuccess(userId, user.getUsername(), "CREATE_REQUIREMENT", 
                    "Requirement", req.getId(), project.getId(), null, 
                    "INTERNAL", "POST", "/api/generate/approve/" + generationId, 0L);
        }
        
        staging.setStatus(AiGenerationStatus.CONFIRMED);
        if (modifiedPayload != null) {
            staging.setPayload(modifiedPayload);
        }
        stagingRepository.save(staging);
    }

    @Transactional
    public void approveUseCaseGeneration(UUID generationId, org.example.backend.dto.ai.ApproveUseCaseGenerationRequest request, Long userId) {
        // 1. Pessimistic lock to prevent concurrent approvals
        AiGenerationStaging staging = stagingRepository.findByGenerationIdForUpdate(generationId)
                .orElseThrow(() -> new BusinessException("Generation not found: " + generationId));

        // 2. Verify status
        if (staging.getStatus() != AiGenerationStatus.PENDING) {
            throw new BusinessException("Generation is not PENDING. Current status: " + staging.getStatus());
        }

        // 3. Authorization: derive projectId from staging, not from request
        Project project = staging.getProject();
        boolean isMember = projectMemberRepository.findByProjectIdAndUserId(project.getId(), userId).isPresent();
        if (!isMember) {
            throw new BusinessException("Forbidden: You are not a member of this project.");
        }

        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found: " + userId));

        // 4. Validate request (schema version, limits)
        JsonNode modifiedPayload = objectMapper.valueToTree(request.getModifiedPayload());
        String schemaVersion = modifiedPayload.has("schemaVersion") ? modifiedPayload.get("schemaVersion").asText() : "2.0";
        useCaseGenerationValidator.validateApproveRequest(request, null);

        if ("3.0".equals(schemaVersion)) {
            approveUseCaseGenerationV3(staging, request, project, user, userId);
        } else if ("modules-only".equals(schemaVersion)) {
            // Plan Modules Only: create BusinessModules with assignees, no UCs
            approveModulePlanOnly(staging, modifiedPayload, project, user);
        } else {
            // Legacy / schema 2.0 path
            List<Integer> selectedIndices = request.getSelectedIndices();
            approveUseCaseGenerationLegacy(staging, selectedIndices, modifiedPayload, project, user);
        }

        // 5. Mark confirmed and commit
        staging.setStatus(AiGenerationStatus.CONFIRMED);
        staging.setPayload(modifiedPayload);
        stagingRepository.save(staging);
    }

    private void approveUseCaseGenerationV3(AiGenerationStaging staging, org.example.backend.dto.ai.ApproveUseCaseGenerationRequest request, Project project, UserAccount user, Long userId) {
        JsonNode modifiedPayload = objectMapper.valueToTree(request.getModifiedPayload());
        List<String> selectedModuleRefs = request.getSelectedModuleRefs();
        List<String> selectedUseCaseIds = request.getSelectedUseCaseIds();

        // Validate: no selected module may have zero selected use cases
        java.util.Set<String> selectedUcIdSet = new java.util.HashSet<>(selectedUseCaseIds);

        // Parse modules from payload
        JsonNode modulesNode = modifiedPayload.has("modules") ? modifiedPayload.get("modules") : objectMapper.createArrayNode();
        JsonNode useCasesNode = modifiedPayload.has("useCases") ? modifiedPayload.get("useCases") : objectMapper.createArrayNode();

        // Build module ref -> module draft map
        java.util.Map<String, JsonNode> moduleByRef = new java.util.LinkedHashMap<>();
        for (JsonNode m : modulesNode) {
            String ref = m.has("temporaryId") ? m.get("temporaryId").asText() : null;
            if (ref != null) moduleByRef.put(ref, m);
        }

        // Validate: each selected module must have at least one selected UC
        for (String moduleRef : selectedModuleRefs) {
            boolean hasUc = false;
            for (JsonNode uc : useCasesNode) {
                String ucRef = uc.has("temporaryId") ? uc.get("temporaryId").asText() : null;
                String ucModule = uc.has("moduleRef") ? uc.get("moduleRef").asText() : null;
                if (selectedUcIdSet.contains(ucRef) && moduleRef.equals(ucModule)) {
                    hasUc = true;
                    break;
                }
            }
            if (!hasUc) {
                throw new BusinessException("Module '" + moduleRef + "' is selected but has no selected Use Cases. Please deselect it or select at least one of its Use Cases.");
            }
        }

        // Phase 1: Resolve or create Business Modules
        java.util.Map<String, org.example.backend.entity.BusinessModule> moduleRefToEntity = new java.util.HashMap<>();
        for (String moduleRef : selectedModuleRefs) {
            JsonNode moduleDraft = moduleByRef.get(moduleRef);
            if (moduleDraft == null) continue;

            String moduleName = moduleDraft.has("name") ? moduleDraft.get("name").asText() : moduleRef;
            Long existingModuleId = moduleDraft.has("existingModuleId") && !moduleDraft.get("existingModuleId").isNull()
                    ? moduleDraft.get("existingModuleId").asLong() : null;

            // Forbidden name check for new modules
            if (existingModuleId == null) {
                java.util.Set<String> forbiddenNames = java.util.Set.of("general", "core", "main", "system", "system management", "fallback module");
                if (forbiddenNames.contains(moduleName.trim().toLowerCase(java.util.Locale.ROOT))) {
                    throw new BusinessException("Module name '" + moduleName + "' is not allowed. Please use a specific functional area name.");
                }
            }

            org.example.backend.entity.BusinessModule moduleEntity;
            if (existingModuleId != null) {
                moduleEntity = businessModuleRepository.findById(existingModuleId)
                        .orElseThrow(() -> new BusinessException("Existing module not found: " + existingModuleId));
                // Security: verify it belongs to this project
                if (!moduleEntity.getProject().getId().equals(project.getId())) {
                    throw new BusinessException("Module " + existingModuleId + " does not belong to this project.");
                }
            } else {
                // Find by name or create
                java.util.List<org.example.backend.entity.BusinessModule> existing = businessModuleRepository.findByProjectId(project.getId());
                String normalizedNew = moduleName.trim().toLowerCase(java.util.Locale.ROOT);
                moduleEntity = existing.stream()
                        .filter(m -> m.getName().trim().toLowerCase(java.util.Locale.ROOT).equals(normalizedNew))
                        .findFirst()
                        .orElse(null);
                if (moduleEntity == null) {
                    String priority = moduleDraft.has("priority") ? moduleDraft.get("priority").asText() : "MEDIUM";
                    moduleEntity = org.example.backend.entity.BusinessModule.builder()
                            .project(project)
                            .name(moduleName)
                            .description(moduleDraft.has("description") ? moduleDraft.get("description").asText() : null)
                            .priority(priority)
                            .build();
                    moduleEntity = businessModuleRepository.save(moduleEntity);
                }
            }
            moduleRefToEntity.put(moduleRef, moduleEntity);
        }

        // Resolve actors from payload
        java.util.Map<String, org.example.backend.entity.ProjectActor> actorRefToEntity = resolveActors(modifiedPayload, project);

        // Phase 2: Create Use Cases
        Integer maxSubId = useCaseRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;

        // Build tempId -> DB code map for includes/extends resolution
        java.util.Map<String, String> tempIdToCode = new java.util.HashMap<>();
        java.util.List<UseCase> useCasesToSave = new java.util.ArrayList<>();

        for (JsonNode ucNode : useCasesNode) {
            String tempId = ucNode.has("temporaryId") ? ucNode.get("temporaryId").asText() : null;
            if (tempId == null || !selectedUcIdSet.contains(tempId)) continue;

            String moduleRef = ucNode.has("moduleRef") ? ucNode.get("moduleRef").asText() : null;
            org.example.backend.entity.BusinessModule moduleEntity = moduleRef != null ? moduleRefToEntity.get(moduleRef) : null;

            UseCase uc = new UseCase();
            uc.setProjectId(project.getId());
            uc.setName(ucNode.has("name") ? ucNode.get("name").asText() : "AI Use Case");

            // precondition — use AI value or generate reasonable default
            String precondition = ucNode.has("precondition") ? ucNode.get("precondition").asText("").trim() : "";
            if (precondition.isEmpty()) {
                precondition = "The user is authenticated and has the necessary permissions to perform this action.";
            }
            uc.setPrecondition(precondition);

            // postcondition — use AI value or generate reasonable default
            String postcondition = ucNode.has("postcondition") ? ucNode.get("postcondition").asText("").trim() : "";
            if (postcondition.isEmpty()) {
                String ucName = ucNode.has("name") ? ucNode.get("name").asText("") : "";
                postcondition = ucName.isBlank()
                    ? "The requested operation has been completed successfully."
                    : "The '" + ucName + "' operation has been completed and the system state has been updated accordingly.";
            }
            uc.setPostcondition(postcondition);
            uc.setStatus(org.example.backend.entity.UseCaseStatus.DRAFT);
            uc.setProjectSubId(nextSubId);
            uc.setCode(org.example.backend.constant.UseCaseConstants.CODE_PREFIX + project.getId() + org.example.backend.constant.UseCaseConstants.CODE_INFIX + nextSubId);
            uc.setVersion(org.example.backend.constant.UseCaseConstants.DEFAULT_VERSION);
            uc.setCreatedBy(user);
            uc.setAiGenerated(true);
            uc.setSourceGenerationId(staging.getGenerationId());
            uc.setBusinessModule(moduleEntity);

            // Main flow: convert StructuredMainFlow to storage-friendly { steps: string[] }
            if (ucNode.has("mainFlow") && !ucNode.get("mainFlow").isNull()) {
                JsonNode mainFlowNode = ucNode.get("mainFlow");
                try {
                    uc.setMainFlow(objectMapper.writeValueAsString(normalizeMainFlowForStorage(mainFlowNode)));
                } catch (Exception e) { uc.setMainFlow("{}"); }
            } else if (ucNode.has("mainSuccessScenario") && !ucNode.get("mainSuccessScenario").isNull()) {
                String scenarioText = ucNode.get("mainSuccessScenario").asText();
                if (!scenarioText.isBlank()) {
                    java.util.Map<String, Object> flowMap = new java.util.HashMap<>();
                    flowMap.put("steps", splitTextToStepList(scenarioText));
                    try { uc.setMainFlow(objectMapper.writeValueAsString(flowMap)); } catch (Exception e) { uc.setMainFlow("{}"); }
                } else {
                    uc.setMainFlow("{}");
                }
            } else {
                uc.setMainFlow("{}");
            }

            // Alternative flows: convert StructuredAlternativeFlow to storage-friendly { flows: [{condition, branchFromStep, steps: string[]}] }
            if (ucNode.has("alternativeFlows") && !ucNode.get("alternativeFlows").isNull()) {
                JsonNode altFlowNode = ucNode.get("alternativeFlows");
                try {
                    uc.setAlternativeFlow(objectMapper.writeValueAsString(normalizeAltFlowForStorage(altFlowNode)));
                } catch (Exception e) { uc.setAlternativeFlow("{}"); }
            } else if (ucNode.has("alternativeFlowsText") && !ucNode.get("alternativeFlowsText").asText().isBlank()) {
                String altText = ucNode.get("alternativeFlowsText").asText();
                java.util.Map<String, Object> altMap = new java.util.HashMap<>();
                altMap.put("flows", java.util.List.of(java.util.Map.of("condition", altText, "branchFromStep", 1, "steps", java.util.List.of())));
                try { uc.setAlternativeFlow(objectMapper.writeValueAsString(altMap)); } catch (Exception e) { uc.setAlternativeFlow("{}"); }
            } else {
                uc.setAlternativeFlow("{}");
            }

            // Actors
            if (ucNode.has("actors") && ucNode.get("actors").isArray()) {
                java.util.List<org.example.backend.entity.UseCaseActor> actorList = new java.util.ArrayList<>();
                for (JsonNode actorRef : ucNode.get("actors")) {
                    String ref = actorRef.has("actorRef") ? actorRef.get("actorRef").asText() : null;
                    String role = actorRef.has("role") ? actorRef.get("role").asText() : "PRIMARY";
                    if (ref == null) continue;
                    org.example.backend.entity.UseCaseActor actor = new org.example.backend.entity.UseCaseActor();
                    org.example.backend.entity.ProjectActor projectActor = actorRefToEntity.get(ref);
                    actor.setActorName(projectActor != null ? projectActor.getName() : ref);
                    actor.setUseCase(uc);
                    actorList.add(actor);
                }
                uc.setActors(actorList);
            } else if (ucNode.has("primaryActors") && !ucNode.get("primaryActors").asText().isBlank()) {
                java.util.List<org.example.backend.entity.UseCaseActor> actorList = new java.util.ArrayList<>();
                for (String actorName : ucNode.get("primaryActors").asText().split(",")) {
                    org.example.backend.entity.UseCaseActor actor = new org.example.backend.entity.UseCaseActor();
                    actor.setActorName(actorName.trim());
                    actor.setUseCase(uc);
                    actorList.add(actor);
                }
                uc.setActors(actorList);
            }

            // Requirement associations
            if (ucNode.has("requirementIds") && ucNode.get("requirementIds").isArray()) {
                java.util.List<Requirement> reqs = new java.util.ArrayList<>();
                for (JsonNode reqIdNode : ucNode.get("requirementIds")) {
                    requirementRepository.findById(reqIdNode.asLong()).ifPresent(r -> {
                        if (r.getProject().getId().equals(project.getId())) reqs.add(r);
                    });
                }
                uc.setRequirements(reqs);
                if (!reqs.isEmpty() && uc.getRequirement() == null) {
                    uc.setRequirement(reqs.get(0));
                }
            }

            tempIdToCode.put(tempId, uc.getCode());
            useCasesToSave.add(uc);
            nextSubId++;
        }

        useCaseRepository.saveAll(useCasesToSave);

        // Phase 3: Update includes/extends (map tempIds -> codes; remove self-refs, remove missing)
        for (UseCase uc : useCasesToSave) {
            String tempId = null;
            // find tempId for this uc
            for (java.util.Map.Entry<String, String> e : tempIdToCode.entrySet()) {
                if (e.getValue().equals(uc.getCode())) { tempId = e.getKey(); break; }
            }
            if (tempId == null) continue;

            // Find the original ucNode
            for (JsonNode ucNode : useCasesNode) {
                if (!tempId.equals(ucNode.has("temporaryId") ? ucNode.get("temporaryId").asText() : null)) continue;
                
                java.util.List<String> includes = new java.util.ArrayList<>();
                if (ucNode.has("includes") && ucNode.get("includes").isArray()) {
                    for (JsonNode inc : ucNode.get("includes")) {
                        String targetCode = tempIdToCode.get(inc.asText());
                        if (targetCode != null && !targetCode.equals(uc.getCode())) includes.add(targetCode);
                    }
                }
                uc.setIncludesList(includes);

                java.util.List<String> extendsList = new java.util.ArrayList<>();
                if (ucNode.has("extendsList") && ucNode.get("extendsList").isArray()) {
                    for (JsonNode ext : ucNode.get("extendsList")) {
                        String targetCode = tempIdToCode.get(ext.asText());
                        if (targetCode != null && !targetCode.equals(uc.getCode())) extendsList.add(targetCode);
                    }
                }
                uc.setExtendsList(extendsList);
                break;
            }
        }
        useCaseRepository.saveAll(useCasesToSave);

        // Move requirements to their new Business Module
        for (java.util.Map.Entry<String, org.example.backend.entity.BusinessModule> entry : moduleRefToEntity.entrySet()) {
            org.example.backend.entity.BusinessModule moduleEntity = entry.getValue();
            for (UseCase uc : useCasesToSave) {
                if (moduleEntity.equals(uc.getBusinessModule()) && uc.getRequirements() != null) {
                    for (Requirement req : uc.getRequirements()) {
                        if (req.getBusinessModule() == null) {
                            req.setBusinessModule(moduleEntity);
                            requirementRepository.save(req);
                        }
                    }
                }
            }
        }

        // Audit
        for (UseCase uc : useCasesToSave) {
            auditService.publishSuccess(userId, user.getUsername(), "CREATE_USE_CASE",
                    "UseCase", uc.getId(), project.getId(), null,
                    "INTERNAL", "POST", "/api/ai/approve-use-cases/" + staging.getGenerationId(), 0L);
        }
    }

    private java.util.Map<String, org.example.backend.entity.ProjectActor> resolveActors(JsonNode payload, Project project) {
        java.util.Map<String, org.example.backend.entity.ProjectActor> actorRefToEntity = new java.util.HashMap<>();
        java.util.List<org.example.backend.entity.ProjectActor> existingActors = projectActorRepository.findByProjectId(project.getId());
        java.util.Map<String, org.example.backend.entity.ProjectActor> existingByName = new java.util.HashMap<>();
        for (org.example.backend.entity.ProjectActor a : existingActors) {
            existingByName.put(a.getName().trim().toLowerCase(java.util.Locale.ROOT), a);
        }

        // Map existing actor refs
        if (payload.has("existingActorsUsed") && payload.get("existingActorsUsed").isArray()) {
            for (JsonNode actorNode : payload.get("existingActorsUsed")) {
                Long existingId = actorNode.has("existingActorId") && !actorNode.get("existingActorId").isNull()
                        ? actorNode.get("existingActorId").asLong() : null;
                String ref = actorNode.has("temporaryId") ? actorNode.get("temporaryId").asText() : null;
                if (existingId != null && ref != null) {
                    projectActorRepository.findById(existingId).ifPresent(a -> actorRefToEntity.put(ref, a));
                }
            }
        }

        // Create proposed actors
        if (payload.has("proposedActors") && payload.get("proposedActors").isArray()) {
            java.util.List<org.example.backend.entity.ProjectActor> toCreate = new java.util.ArrayList<>();
            for (JsonNode actorNode : payload.get("proposedActors")) {
                String name = actorNode.has("name") ? actorNode.get("name").asText().trim() : null;
                String ref = actorNode.has("temporaryId") ? actorNode.get("temporaryId").asText() : null;
                if (name == null || name.isBlank() || ref == null) continue;
                String normalizedName = name.toLowerCase(java.util.Locale.ROOT);
                org.example.backend.entity.ProjectActor actor = existingByName.get(normalizedName);
                if (actor == null) {
                    actor = org.example.backend.entity.ProjectActor.builder()
                            .project(project)
                            .name(name)
                            .description(actorNode.has("description") ? actorNode.get("description").asText() : "")
                            .build();
                    toCreate.add(actor);
                    existingByName.put(normalizedName, actor);
                }
                actorRefToEntity.put(ref, actor);
            }
            if (!toCreate.isEmpty()) {
                projectActorRepository.saveAll(toCreate);
            }
        }
        return actorRefToEntity;
    }

    /**
     * Convert StructuredMainFlow { steps: [{step, actorRef, actorAction, systemResponse}] }
     * into storage-friendly { steps: string[] } that UseCaseMainFlow.jsx can render.
     * Also handles legacy { steps: string[] } — passes through unchanged.
     */
    private java.util.Map<String, Object> normalizeMainFlowForStorage(JsonNode mainFlowNode) {
        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        if (mainFlowNode == null || mainFlowNode.isNull()) {
            result.put("steps", java.util.List.of());
            return result;
        }
        // Textual: wrap as single step
        if (mainFlowNode.isTextual()) {
            result.put("steps", splitTextToStepList(mainFlowNode.asText()));
            return result;
        }
        // Object with steps array
        JsonNode stepsNode = mainFlowNode.has("steps") ? mainFlowNode.get("steps") : mainFlowNode;
        if (stepsNode != null && stepsNode.isArray()) {
            java.util.List<String> steps = new java.util.ArrayList<>();
            for (JsonNode stepNode : stepsNode) {
                if (stepNode.isTextual()) {
                    steps.add(stepNode.asText());
                } else if (stepNode.isObject()) {
                    // StructuredMainFlow.MainStep: {step, actorRef, actorAction, systemResponse}
                    int stepNum = stepNode.has("step") ? stepNode.get("step").asInt() : (steps.size() + 1);
                    String actorRef = stepNode.has("actorRef") ? stepNode.get("actorRef").asText("") : "";
                    String actorAction = stepNode.has("actorAction") ? stepNode.get("actorAction").asText("") : "";
                    String systemResponse = stepNode.has("systemResponse") ? stepNode.get("systemResponse").asText("") : "";
                    // Format: "N. [ActorRef] actorAction"  + "   → System: systemResponse"
                    StringBuilder sb = new StringBuilder();
                    sb.append(stepNum).append(". ");
                    if (!actorRef.isBlank()) sb.append("[").append(actorRef).append("] ");
                    sb.append(actorAction);
                    steps.add(sb.toString());
                    if (!systemResponse.isBlank()) {
                        steps.add("   → System: " + systemResponse);
                    }
                }
            }
            result.put("steps", steps);
        } else {
            result.put("steps", java.util.List.of());
        }
        return result;
    }

    /**
     * Convert StructuredAlternativeFlow { flows: [{id, triggerStep, condition, steps: [{step, actorRef, action}]}] }
     * into storage-friendly { flows: [{condition, branchFromStep, steps: string[]}] }
     * that UseCaseAlternativeFlows.jsx can render.
     */
    private java.util.Map<String, Object> normalizeAltFlowForStorage(JsonNode altFlowNode) {
        java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
        if (altFlowNode == null || altFlowNode.isNull()) {
            result.put("flows", java.util.List.of());
            return result;
        }
        if (altFlowNode.isTextual()) {
            String text = altFlowNode.asText();
            result.put("flows", text.isBlank() ? java.util.List.of() :
                java.util.List.of(java.util.Map.of("condition", text, "branchFromStep", 1, "steps", java.util.List.of())));
            return result;
        }
        JsonNode flowsNode = altFlowNode.has("flows") ? altFlowNode.get("flows") : altFlowNode;
        if (flowsNode != null && flowsNode.isArray()) {
            java.util.List<java.util.Map<String, Object>> flows = new java.util.ArrayList<>();
            for (JsonNode flowNode : flowsNode) {
                java.util.Map<String, Object> flowMap = new java.util.LinkedHashMap<>();
                // Condition
                String condition = flowNode.has("condition") ? flowNode.get("condition").asText("") : "";
                if (condition.isBlank() && flowNode.has("id")) condition = flowNode.get("id").asText("");
                flowMap.put("condition", condition);
                // Branch step — use triggerStep or branchFromStep
                int branchStep = 1;
                if (flowNode.has("triggerStep")) branchStep = flowNode.get("triggerStep").asInt(1);
                else if (flowNode.has("branchFromStep")) branchStep = flowNode.get("branchFromStep").asInt(1);
                flowMap.put("branchFromStep", branchStep);
                // Steps
                java.util.List<String> steps = new java.util.ArrayList<>();
                JsonNode stepsNode = flowNode.has("steps") ? flowNode.get("steps") : null;
                if (stepsNode != null && stepsNode.isArray()) {
                    for (JsonNode s : stepsNode) {
                        if (s.isTextual()) {
                            steps.add(s.asText());
                        } else if (s.isObject()) {
                            // AltStep: {step, actorRef, action}
                            String actorRef = s.has("actorRef") ? s.get("actorRef").asText("") : "";
                            String action = s.has("action") ? s.get("action").asText("") :
                                            (s.has("actorAction") ? s.get("actorAction").asText("") : "");
                            StringBuilder sb = new StringBuilder();
                            if (!actorRef.isBlank()) sb.append("[").append(actorRef).append("] ");
                            sb.append(action);
                            steps.add(sb.toString());
                        }
                    }
                }
                flowMap.put("steps", steps);
                flows.add(flowMap);
            }
            result.put("flows", flows);
        } else {
            result.put("flows", java.util.List.of());
        }
        return result;
    }

    /** Split multiline text into a list of non-blank lines */
    private java.util.List<String> splitTextToStepList(String text) {
        if (text == null || text.isBlank()) return java.util.List.of();
        java.util.List<String> steps = new java.util.ArrayList<>();
        for (String line : text.split("\n")) {
            String trimmed = line.trim();
            if (!trimmed.isBlank()) steps.add(trimmed);
        }
        return steps.isEmpty() ? java.util.List.of(text.trim()) : steps;
    }

    private void approveModulePlanOnly(AiGenerationStaging staging, JsonNode modifiedPayload, Project project, UserAccount approver) {
        JsonNode modulesNode = modifiedPayload.has("modules") ? modifiedPayload.get("modules") : objectMapper.createArrayNode();

        java.util.Set<String> forbiddenNames = java.util.Set.of("general", "core", "main", "system", "system management", "fallback module");
        java.util.List<org.example.backend.entity.BusinessModule> existing = businessModuleRepository.findByProjectId(project.getId());

        for (JsonNode moduleDraft : modulesNode) {
            String moduleName = moduleDraft.has("name") ? moduleDraft.get("name").asText("").trim() : "";
            if (moduleName.isEmpty()) continue;

            // Skip forbidden names for new modules
            if (forbiddenNames.contains(moduleName.toLowerCase(java.util.Locale.ROOT))) continue;

            // Find or create
            String normalizedNew = moduleName.toLowerCase(java.util.Locale.ROOT);
            org.example.backend.entity.BusinessModule moduleEntity = existing.stream()
                    .filter(m -> m.getName().trim().toLowerCase(java.util.Locale.ROOT).equals(normalizedNew))
                    .findFirst().orElse(null);

            if (moduleEntity == null) {
                moduleEntity = org.example.backend.entity.BusinessModule.builder()
                        .project(project)
                        .name(moduleName)
                        .description(moduleDraft.has("description") ? moduleDraft.get("description").asText() : null)
                        .priority(moduleDraft.has("priority") ? moduleDraft.get("priority").asText("MEDIUM") : "MEDIUM")
                        .build();
            }

            // Set assignee from suggestedAssigneeId (user may have edited in UI)
            Long assigneeId = null;
            if (moduleDraft.has("suggestedAssigneeId") && !moduleDraft.get("suggestedAssigneeId").isNull()) {
                assigneeId = moduleDraft.get("suggestedAssigneeId").asLong();
            }
            if (assigneeId != null && assigneeId > 0) {
                userRepository.findById(assigneeId).ifPresent(moduleEntity::setAssignee);
            }

            businessModuleRepository.save(moduleEntity);
        }

        log.info("Module plan approved: created/updated {} modules for project {}", modulesNode.size(), project.getId());
    }

    private void approveUseCaseGenerationLegacy(AiGenerationStaging staging, List<Integer> selectedIndices, JsonNode modifiedPayload, Project project, UserAccount user) {
        UUID generationId = staging.getGenerationId();
        Long userId = user.getId();
        org.example.backend.dto.ai.UseCaseGenerationPayload normalizedPayload = useCaseGenerationPayloadNormalizer.normalize(modifiedPayload);
        java.util.List<org.example.backend.dto.ai.GeneratedUseCaseDraft> useCases = normalizedPayload.getUseCases();

        if (useCases == null || useCases.isEmpty()) {
            throw new BusinessException("No use cases found in the payload.");
        }

        // Ensure index bounds
        if (selectedIndices != null) {
            for (Integer idx : selectedIndices) {
                if (idx < 0 || idx >= useCases.size()) throw new BusinessException("Selected index out of range: " + idx);
            }
        }

        Integer maxSubId = useCaseRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        java.util.List<UseCase> useCasesToSave = new java.util.ArrayList<>();

        for (int i = 0; i < useCases.size(); i++) {
            if (selectedIndices != null && !selectedIndices.contains(i)) continue;
            org.example.backend.dto.ai.GeneratedUseCaseDraft draft = useCases.get(i);

            UseCase uc = new UseCase();
            uc.setProjectId(project.getId());
            uc.setName(draft.getName() != null ? draft.getName() : "AI Use Case");
            uc.setPrecondition(draft.getPrecondition() != null ? draft.getPrecondition() : "");
            uc.setPostcondition(draft.getPostcondition() != null ? draft.getPostcondition() : "");
            uc.setStatus(org.example.backend.entity.UseCaseStatus.DRAFT);
            uc.setProjectSubId(nextSubId);
            uc.setCode(org.example.backend.constant.UseCaseConstants.CODE_PREFIX + project.getId() + org.example.backend.constant.UseCaseConstants.CODE_INFIX + nextSubId);
            uc.setVersion(org.example.backend.constant.UseCaseConstants.DEFAULT_VERSION);
            uc.setCreatedBy(user);
            uc.setAiGenerated(true);
            uc.setSourceGenerationId(generationId);

            // Main flow
            if (draft.getMainFlow() != null) {
                try { uc.setMainFlow(objectMapper.writeValueAsString(draft.getMainFlow())); } catch (Exception e) { uc.setMainFlow("{}"); }
            } else if (draft.getMainSuccessScenario() != null) {
                java.util.Map<String, Object> flowMap = new java.util.HashMap<>();
                flowMap.put("steps", java.util.List.of(draft.getMainSuccessScenario()));
                try { uc.setMainFlow(objectMapper.writeValueAsString(flowMap)); } catch (Exception e) { uc.setMainFlow("{}"); }
            } else {
                uc.setMainFlow("{}");
            }

            if (draft.getAlternativeFlows() != null) {
                try { uc.setAlternativeFlow(objectMapper.writeValueAsString(draft.getAlternativeFlows())); } catch (Exception e) { uc.setAlternativeFlow("{}"); }
            } else {
                uc.setAlternativeFlow("{}");
            }

            // Actors from primaryActors string
            if (draft.getPrimaryActors() != null && !draft.getPrimaryActors().isBlank()) {
                java.util.List<org.example.backend.entity.UseCaseActor> actorList = new java.util.ArrayList<>();
                for (String actorName : draft.getPrimaryActors().split(",")) {
                    org.example.backend.entity.UseCaseActor actor = new org.example.backend.entity.UseCaseActor();
                    actor.setActorName(actorName.trim());
                    actor.setUseCase(uc);
                    actorList.add(actor);
                }
                uc.setActors(actorList);
            }

            // Requirement associations
            if (draft.getRequirementIds() != null && !draft.getRequirementIds().isEmpty()) {
                java.util.List<Requirement> reqs = new java.util.ArrayList<>();
                for (Long reqId : draft.getRequirementIds()) {
                    requirementRepository.findById(reqId).ifPresent(r -> {
                        if (r.getProject().getId().equals(project.getId())) reqs.add(r);
                    });
                }
                uc.setRequirements(reqs);
                if (!reqs.isEmpty()) uc.setRequirement(reqs.get(0));
            }

            useCasesToSave.add(uc);
            nextSubId++;
        }

        useCaseRepository.saveAll(useCasesToSave);

        for (UseCase uc : useCasesToSave) {
            auditService.publishSuccess(userId, user.getUsername(), "CREATE_USE_CASE",
                    "UseCase", uc.getId(), project.getId(), null,
                    "INTERNAL", "POST", "/api/ai/approve-use-cases/" + generationId, 0L);
        }
    }

    @Transactional
    public List<org.example.backend.dto.testing.TestCaseResponse> approveTestCaseGeneration(UUID generationId, List<Integer> selectedIndices, JsonNode modifiedPayload, Long userId, Long projectId) {
        if (selectedIndices != null && selectedIndices.isEmpty()) {
            throw new BusinessException("Please select at least one test case to approve.");
        }

        List<AiGenerationStaging> stagings = stagingRepository.findByGenerationId(generationId);
        if (stagings.isEmpty()) {
            throw new RuntimeException("Không tìm thấy dữ liệu staging với ID: " + generationId);
        }

        AiGenerationStaging staging = stagings.get(0);
        if (staging.getStatus() != AiGenerationStatus.PENDING) {
            throw new RuntimeException("Dữ liệu này đã được duyệt hoặc bị từ chối.");
        }

        Project project = staging.getProject();
        if (project == null || !projectId.equals(project.getId())) {
            throw new BusinessException("Generation data doesn't match the project.");
        }

        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với ID: " + userId));
        
        JsonNode payload = modifiedPayload != null ? modifiedPayload : staging.getPayload();
        if (payload == null || payload.isNull()) {
            throw new BusinessException("AI generation payload is empty.");
        }

        JsonNode testCasesArray = payload;
        if (payload.isObject() && payload.has("testCases")) {
            testCasesArray = payload.get("testCases");
        }
        if (testCasesArray == null || !testCasesArray.isArray()) {
            throw new BusinessException("AI generation payload must contain a testCases array.");
        }
        if (selectedIndices != null) {
            for (Integer selectedIndex : selectedIndices) {
                if (selectedIndex == null || selectedIndex < 0 || selectedIndex >= testCasesArray.size()) {
                    throw new BusinessException("Selected test case index is out of range.");
                }
            }
        }
        
        Integer maxSubId = testCaseRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        
        List<TestCase> testCasesToSave = new ArrayList<>();
        
        for (int i = 0; i < testCasesArray.size(); i++) {
            if (selectedIndices == null || selectedIndices.contains(i)) {
                JsonNode tcNode = testCasesArray.get(i);
                String validationStatus = tcNode.path("validationStatus").asText("");
                if ("INVALID".equalsIgnoreCase(validationStatus)) {
                    String title = tcNode.has("title") ? tcNode.get("title").asText() : ("index " + i);
                    throw new BusinessException("Cannot approve invalid AI test case: " + title + ". Please fix validation errors first.");
                }
                
                TestCase tc = new TestCase();
                tc.setProjectId(project.getId());
                String title = tcNode.has("title") ? tcNode.get("title").asText() : "";
                if (title == null || title.trim().isEmpty()) {
                    throw new BusinessException("Test case title is required.");
                }
                if (title.trim().length() > 200) {
                    throw new BusinessException("Test case title must not exceed 200 characters.");
                }
                tc.setTitle(title.trim());
                if (tcNode.has("requirementId") && !tcNode.get("requirementId").isNull()) {
                    Long requirementId = tcNode.get("requirementId").asLong();
                    Requirement requirement = requirementRepository.findById(requirementId)
                            .orElseThrow(() -> new BusinessException("Requirement " + requirementId + " was not found."));
                    if (requirement.getProject() == null || !project.getId().equals(requirement.getProject().getId())) {
                        throw new BusinessException("Requirement " + requirementId + " does not belong to this project.");
                    }
                    tc.setRequirementId(requirementId);
                } else {
                    throw new BusinessException("Requirement is required for all test cases.");
                }
                
                tc.setPrecondition(tcNode.path("precondition").asText(""));
                String expectedResult = tcNode.path("expectedResult").asText("");
                if (expectedResult == null || expectedResult.trim().isEmpty()) {
                    throw new BusinessException("Expected result is required for all test cases.");
                }
                tc.setExpectedResult(expectedResult.trim());
                tc.setStatus(TestCaseStatus.NOT_RUN);
                tc.setCreatedBy(userId);
                tc.setProjectSubId(nextSubId);
                tc.setTcCode("TC-" + nextSubId);
                
                String typeStr = tcNode.path("type").asText("MANUAL").trim().toUpperCase(Locale.ROOT);
                try {
                    tc.setType(TestType.valueOf(typeStr));
                } catch (Exception e) {
                    tc.setType(TestType.MANUAL);
                }
                
                // Map Configuration based on Type
                JsonNode configNode = tcNode.has("configuration") ? tcNode.get("configuration") : tcNode;
                JsonNode uiExecutableSteps = null;
                
                if (tc.getType() == TestType.UI) {
                    org.example.backend.entity.config.UiTestConfig uiConfig = new org.example.backend.entity.config.UiTestConfig();
                    if (configNode.has("baseUrl")) uiConfig.setBaseUrl(configNode.get("baseUrl").asText());
                    uiExecutableSteps = normalizeUiExecutableSteps(configNode, tcNode.get("steps"), tc.getTitle());
                    uiConfig.setSteps(uiExecutableSteps);
                    uiConfig.setTestCase(tc);
                    tc.setUiConfig(uiConfig);
                } else if (tc.getType() == TestType.API) {
                    org.example.backend.entity.config.ApiTestConfig apiConfig = new org.example.backend.entity.config.ApiTestConfig();
                    String apiMethod = configNode.has("apiMethod")
                            ? configNode.get("apiMethod").asText("GET").trim().toUpperCase(Locale.ROOT)
                            : "GET";
                    if (!java.util.Set.of("GET", "POST", "PUT", "PATCH", "DELETE").contains(apiMethod)) {
                        throw new BusinessException("API method is invalid for test case: " + tc.getTitle());
                    }
                    apiConfig.setApiMethod(apiMethod);
                    String apiUrl = "";
                    if (configNode.has("apiUrl") && !configNode.get("apiUrl").isNull()) {
                        apiUrl = configNode.get("apiUrl").asText();
                    } else if (configNode.has("apiEndpoint") && !configNode.get("apiEndpoint").isNull()) {
                        apiUrl = configNode.get("apiEndpoint").asText();
                    }
                    if (apiUrl == null || apiUrl.trim().isEmpty()) {
                        throw new BusinessException("API URL is required for test case: " + tc.getTitle());
                    }
                    apiConfig.setApiUrl(apiUrl.trim());
                    if (configNode.has("apiHeaders") && configNode.get("apiHeaders").isObject()) apiConfig.setApiHeaders(configNode.get("apiHeaders"));
                    if (configNode.has("apiQueryParams") && configNode.get("apiQueryParams").isObject()) apiConfig.setApiQueryParams(configNode.get("apiQueryParams"));
                    if (configNode.has("apiBody") && configNode.get("apiBody").isObject()) apiConfig.setApiBody(configNode.get("apiBody"));
                    JsonNode apiAssertions = configNode.has("apiAssertions") ? configNode.get("apiAssertions") : configNode.get("assertions");
                    if (apiAssertions == null || !apiAssertions.isArray() || apiAssertions.isEmpty()) {
                        throw new BusinessException("API assertions are required for test case: " + tc.getTitle());
                    }
                    apiConfig.setApiAssertions(apiAssertions);
                    apiConfig.setTestCase(tc);
                    tc.setApiConfig(apiConfig);
                } else if (tc.getType() == TestType.UNIT) {
                    org.example.backend.entity.config.UnitTestConfig unitConfig = new org.example.backend.entity.config.UnitTestConfig();
                    unitConfig.setTestCase(tc);
                    tc.setUnitConfig(unitConfig);
                } else if (tc.getType() == TestType.INTEGRATION) {
                    org.example.backend.entity.config.IntegrationTestConfig integrationConfig = new org.example.backend.entity.config.IntegrationTestConfig();
                    integrationConfig.setTestCase(tc);
                    tc.setIntegrationConfig(integrationConfig);
                }
                
                // Save first to get ID for TestStep linkage (since TestStep cascade is tricky with new entities manually managed)
                // Actually, cascade = CascadeType.ALL will handle it if we set the relationship on both sides.
                List<TestStep> stepEntities = new ArrayList<>();
                JsonNode humanStepsNode = tc.getType() == TestType.UI && uiExecutableSteps != null ? uiExecutableSteps : tcNode.get("steps");
                if (humanStepsNode == null || !humanStepsNode.isArray() || humanStepsNode.isEmpty()) {
                    throw new BusinessException("At least one test step is required for test case: " + tc.getTitle());
                } else {
                    int stepNum = 1;
                    for (JsonNode stepNode : humanStepsNode) {
                        String stepDescription = stepNode.path("description").asText("");
                        if (stepDescription == null || stepDescription.trim().isEmpty()) {
                            throw new BusinessException("Step description is required for test case: " + tc.getTitle());
                        }
                        TestStep step = new TestStep();
                        step.setTestCase(tc);
                        step.setStepNumber(stepNum++);
                        step.setDescription(stepDescription.trim());
                        stepEntities.add(step);
                    }
                }
                tc.setSteps(stepEntities);
                
                nextSubId++;
                testCasesToSave.add(tc);
            }
        }

        if (testCasesToSave.isEmpty()) {
            throw new BusinessException("No valid selected test cases were found in the AI payload.");
        }

        List<TestCase> savedTestCases = testCaseRepository.saveAll(testCasesToSave);
        
        staging.setStatus(AiGenerationStatus.CONFIRMED);
        if (modifiedPayload != null) {
            staging.setPayload(modifiedPayload);
        }
        stagingRepository.save(staging);
        
        return savedTestCases.stream().map(testCaseMapper::toResponse).toList();
    }

    private com.fasterxml.jackson.databind.node.ArrayNode normalizeUiExecutableSteps(JsonNode configNode, JsonNode rootStepsNode, String title) {
        JsonNode rawSteps = null;
        if (configNode != null && configNode.has("steps") && configNode.get("steps").isArray()) {
            rawSteps = configNode.get("steps");
        } else if (configNode != null && configNode.has("stepsStructured") && configNode.get("stepsStructured").isArray()) {
            rawSteps = configNode.get("stepsStructured");
        }

        if (rawSteps == null || rawSteps.isEmpty()) {
            throw new BusinessException("UI executable steps are required for test case: " + title);
        }

        com.fasterxml.jackson.databind.node.ArrayNode normalizedSteps = objectMapper.createArrayNode();
        for (int i = 0; i < rawSteps.size(); i++) {
            JsonNode stepNode = rawSteps.get(i);
            if (stepNode == null || (!stepNode.isObject() && !stepNode.isTextual())) {
                throw new BusinessException("UI executable step " + (i + 1) + " must be an object for test case: " + title);
            }

            String rootDescription = "";
            if (rootStepsNode != null && rootStepsNode.isArray() && rootStepsNode.size() > i) {
                JsonNode rootStep = rootStepsNode.get(i);
                rootDescription = rootStep.isTextual() ? rootStep.asText() : readTextField(rootStep, "description", "title");
            }
            String description = stepNode.isTextual()
                    ? stepNode.asText()
                    : firstNonBlankText(readTextField(stepNode, "description", "title"), rootDescription);
            String action = stepNode.isObject()
                    ? normalizeUiAction(readTextField(stepNode, "action", "type", "command"), description)
                    : normalizeUiAction("", description);

            com.fasterxml.jackson.databind.node.ObjectNode normalized = objectMapper.createObjectNode();
            normalized.put("order", readIntegerField(stepNode, "order", "stepNumber", i + 1));
            normalized.put("action", action);
            normalized.put("description", firstNonBlankText(description, "Step " + (i + 1)));

            switch (action) {
                case "goto" -> {
                    String path = readTextField(stepNode, "path", "url", "href", "target");
                    if (isBlank(path)) {
                        throw new BusinessException("UI step " + (i + 1) + " requires path for test case: " + title);
                    }
                    normalized.put("path", path);
                }
                case "fill", "click", "select", "wait_for", "expect_text", "expect_visible", "expect_hidden" -> {
                    String selector = readTextField(stepNode, "selector", "locator", "target", "field");
                    if (isBlank(selector)) {
                        throw new BusinessException("UI step " + (i + 1) + " requires selector for test case: " + title);
                    }
                    normalized.put("selector", selector);
                    if ("fill".equals(action) || "select".equals(action)) {
                        String value = readTextField(stepNode, "value", "input", "text", "option");
                        if (isBlank(value)) {
                            throw new BusinessException("UI step " + (i + 1) + " requires value for test case: " + title);
                        }
                        normalized.put("value", value);
                    }
                    if ("expect_text".equals(action)) {
                        String expected = readTextField(stepNode, "expected", "expectedText", "text", "value");
                        if (isBlank(expected)) {
                            throw new BusinessException("UI step " + (i + 1) + " requires expected text for test case: " + title);
                        }
                        normalized.put("expected", expected);
                    }
                }
                case "expect_url" -> {
                    String expected = readTextField(stepNode, "expected", "expectedUrl", "url", "path");
                    if (isBlank(expected)) {
                        throw new BusinessException("UI step " + (i + 1) + " requires expected URL for test case: " + title);
                    }
                    normalized.put("expected", expected);
                }
                default -> throw new BusinessException("Unsupported UI action '" + action + "' for test case: " + title);
            }

            normalizedSteps.add(normalized);
        }

        return normalizedSteps;
    }

    private String normalizeUiAction(String action, String description) {
        String value = action == null ? "" : action.trim().replace('-', '_').replace(' ', '_').toLowerCase(Locale.ROOT);
        if (value.isBlank()) {
            value = inferUiAction(description);
        }
        return switch (value) {
            case "navigate", "navigation", "open", "visit" -> "goto";
            case "type", "input", "enter" -> "fill";
            case "choose" -> "select";
            case "wait", "waitfor" -> "wait_for";
            case "assert_url" -> "expect_url";
            case "assert_text", "verify_text" -> "expect_text";
            case "visible" -> "expect_visible";
            case "hidden" -> "expect_hidden";
            default -> value;
        };
    }

    private String inferUiAction(String description) {
        String text = description == null ? "" : description.toLowerCase(Locale.ROOT);
        if (text.matches(".*(navigate|go to|open|visit|redirect).*")) return "goto";
        if (text.matches(".*(enter|input|type|fill|provide).*")) return "fill";
        if (text.matches(".*(click|tap|press).*")) return "click";
        if (text.matches(".*(select|choose|pick).*")) return "select";
        if (text.matches(".*(wait|loaded|appear).*")) return "wait_for";
        if (text.matches(".*(verify|expect|assert|check|validate|confirm).*")) return "expect_text";
        return "";
    }

    private String readTextField(JsonNode node, String... fieldNames) {
        if (node == null || node.isNull()) return "";
        if (node.isTextual()) return node.asText().trim();
        if (!node.isObject()) return "";
        for (String fieldName : fieldNames) {
            JsonNode value = node.get(fieldName);
            if (value == null || value.isNull()) continue;
            String text = value.isTextual() ? value.asText() : value.toString();
            if (!isBlank(text)) return text.trim();
        }
        return "";
    }

    private int readIntegerField(JsonNode node, String firstField, String secondField, int fallback) {
        if (node != null && node.isObject()) {
            JsonNode first = node.get(firstField);
            if (first != null && first.canConvertToInt()) return first.asInt();
            JsonNode second = node.get(secondField);
            if (second != null && second.canConvertToInt()) return second.asInt();
        }
        return fallback;
    }

    private String firstNonBlankText(String first, String second) {
        return !isBlank(first) ? first : second;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String formatFlowForPrompt(String flowJson) {
        if (flowJson == null || flowJson.trim().isEmpty()) return "None";
        try {
            JsonNode root = objectMapper.readTree(flowJson);
            StringBuilder sb = new StringBuilder();
            if (root.has("steps") && root.get("steps").isArray()) {
                for (JsonNode step : root.get("steps")) {
                    sb.append(step.asText()).append("\n");
                }
                return sb.toString().trim();
            } else if (root.has("flows") && root.get("flows").isArray()) {
                for (JsonNode flow : root.get("flows")) {
                    sb.append(flow.has("name") ? flow.get("name").asText() + ":\n" : "");
                    if (flow.has("steps") && flow.get("steps").isArray()) {
                        for (JsonNode step : flow.get("steps")) {
                            sb.append("  ").append(step.asText()).append("\n");
                        }
                    }
                    sb.append("\n");
                }
                return sb.toString().trim();
            }
        } catch (Exception e) {
            // Ignore, return raw string below
        }
        return flowJson;
    }

    @Transactional(readOnly = true)
    public JsonNode syncUseCasePreview(Long useCaseId) {
        org.example.backend.entity.UseCase uc = useCaseRepository.findById(useCaseId)
            .orElseThrow(() -> new RuntimeException("Use Case not found: " + useCaseId));
            
        Requirement req = uc.getRequirement();
        if (req == null) {
            throw new RuntimeException("This Use Case is not linked to any Requirement.");
        }
        
        Long projectId = req.getProject().getId();
        List<String> projectActors = projectActorRepository.findByProjectId(projectId).stream()
                .map(org.example.backend.entity.ProjectActor::getName)
                .toList();
        List<String> projectExistingUcs = useCaseRepository.findByProjectId(projectId).stream()
                .map(u -> u.getCode() != null ? u.getCode() + ": " + u.getName() : u.getName())
                .toList();

        String typeInstruction = "";
        if (req.getType() != null) {
            switch (req.getType()) {
                case FUNCTIONAL: typeInstruction = "\nInstruction: This is a Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses. Extract Primary Actors and step-by-step flows."; break;
                case NON_FUNCTIONAL: typeInstruction = "\nInstruction: This is a Non-Functional Requirement. If a Use Case cannot be meaningfully created, skip this requirement entirely and return an empty array for it. Do not force the creation of user-action Use Cases."; break;
                case BUSINESS_RULE: typeInstruction = "\nInstruction: This is a Business Rule. Generate exactly one Use Case named 'Validate [Rule Name]' with alternate flows detailing when the rule is violated. Do not generate standard functional flows."; break;
                case SECURITY: typeInstruction = "\nInstruction: This is a Security Requirement. Focus on threat prevention, access control, and data protection. The primary actor for Security Use Cases MUST be 'System' or 'Admin', NOT regular users."; break;
                default: typeInstruction = "\nInstruction: Treat this as a standard Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses."; break;
            }
        } else {
            typeInstruction = "\nInstruction: Treat this as a standard Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses.";
        }
        String reqContext = "Title: " + req.getTitle() + 
            "\nDescription: " + req.getDescription() + 
            "\nType: " + req.getType() + typeInstruction +
            "\nAcceptance Criteria: " + req.getAcceptanceCriteria();
        
        // Fetch actors
        String oldActors = "";
        if (uc.getActors() != null) {
            List<String> actorNames = new ArrayList<>();
            for (org.example.backend.entity.UseCaseActor actor : uc.getActors()) {
                actorNames.add(actor.getActorName());
            }
            oldActors = String.join(", ", actorNames);
        }

        String oldUcContext = "Name: " + uc.getName() + 
            "\nActors: " + oldActors +
            "\nPrecondition: " + uc.getPrecondition() + 
            "\nPostcondition: " + uc.getPostcondition() + 
            "\nMain Flow: " + formatFlowForPrompt(uc.getMainFlow()) + 
            "\nAlternative Flow: " + formatFlowForPrompt(uc.getAlternativeFlow());
        
        // Prompt AI: Cập nhật một Use Case đơn lẻ dựa trên sự thay đổi của Requirement cha.
        // Hướng dẫn AI giữ nguyên các luồng logic cũ nếu không mâu thuẫn, và bổ sung luồng mới nếu Requirement có thêm tính năng.
        String prompt = "You are an expert Business Analyst. Below is an existing Use Case and its updated parent Requirement.\n" +
            "Your task is to analyze the changes in the Requirement and intelligently update the Use Case to match the new Requirement.\n" +
            "CRITICAL RULES:\n" +
            "1. Preserve any existing logical flows, edge cases, and manual customizations in the Old Use Case unless they explicitly contradict the new Requirement.\n" +
            "2. You MUST ADD missing flows or steps if the NEW REQUIREMENT mentions new features, rules, or criteria that are absent in the OLD USE CASE.\n" +
            "3. Your response MUST be a pure JSON object (without ```json wrappers) representing the updated Use Case, with exactly these fields:\n" +
            "   - 'name': (String) The use case name\n" +
            "   - 'precondition': (String) Preconditions\n" +
            "   - 'postcondition': (String) Postconditions\n" +
            "   - 'primaryActors': (String) Comma separated list of actors\n" +
            "   - 'mainFlows': (String) The main success flow, 1 step per line. Number the steps like '1. ...\n2. ...'\n" +
            "   - 'alternativeFlows': (String) Alternative or error flows. The number in 'AF[Number]' MUST BE THE EXACT STEP NUMBER from the main flow that it replaces or branches from. For example, if the flow branches from step 7, it MUST be named 'AF7:'. DO NOT name it 'AF1:' unless it branches from step 1. You MUST separate steps with NEWLINES ('\\n'). Example: 'AF7: If user saves as draft:\\n1. System saves privately.\\n2. User exits.' DO NOT write steps on a single line. DO NOT use markdown formatting like `**` or `*`.\n" +
            "   - 'startDate': (String) A logical start date in YYYY-MM-DD format (must not be before requirement's start date).\n" +
            "   - 'deadline': (String) A logical deadline in YYYY-MM-DD format (must not be after requirement's deadline).\n\n" +
            "STRICT BUSINESS RULE: A Use Case MUST have at least one valid actor in 'primaryActors' if it includes or extends another Use Case. An isolated Use Case without an actor CANNOT include or extend other Use Cases.\n\n" +
            "--- NEW REQUIREMENT ---\n" + reqContext + "\n\n" +
            "--- OLD USE CASE ---\n" + oldUcContext;
            
        String response = geminiService.generateText(prompt);
        response = response.replaceAll("(?s)^.*?```(?:json)?(.*?)```.*$", "$1").trim();
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper lenientMapper = new com.fasterxml.jackson.databind.ObjectMapper()
                .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS.mappedFeature());
            JsonNode root = lenientMapper.readTree(response.trim());
            com.fasterxml.jackson.databind.node.ArrayNode arr = objectMapper.createArrayNode();
            arr.add(root);
            String evalStr = useCaseGeminiService.evaluateUseCasesWithCritic(arr.toString(), java.util.List.of(req), projectExistingUcs, projectActors);
            JsonNode evalArrNode = objectMapper.readTree(evalStr);
            return evalArrNode.get(0);
        } catch (Exception e) {
            log.error("Failed to parse AI response for sync preview: {}", response, e);
            throw new RuntimeException("Failed to generate Use Case preview from AI.");
        }
    }

    @Transactional(readOnly = true)
    public JsonNode syncAllUseCasesPreview(Long reqId) {
        Requirement req = requirementRepository.findById(reqId)
            .orElseThrow(() -> new RuntimeException("Requirement not found: " + reqId));

        List<org.example.backend.entity.UseCase> existingUseCases = useCaseRepository.findByRequirementId(reqId);
        
        Long projectId = req.getProject().getId();
        List<String> projectActors = projectActorRepository.findByProjectId(projectId).stream()
                .map(org.example.backend.entity.ProjectActor::getName)
                .toList();
        List<String> projectExistingUcs = useCaseRepository.findByProjectId(projectId).stream()
                .map(u -> u.getCode() != null ? u.getCode() + ": " + u.getName() : u.getName())
                .toList();

        String typeInstruction = "";
        if (req.getType() != null) {
            switch (req.getType()) {
                case FUNCTIONAL: typeInstruction = "\nInstruction: This is a Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses. Extract Primary Actors and step-by-step flows."; break;
                case NON_FUNCTIONAL: typeInstruction = "\nInstruction: This is a Non-Functional Requirement. If a Use Case cannot be meaningfully created, skip this requirement entirely and return an empty array for it. Do not force the creation of user-action Use Cases."; break;
                case BUSINESS_RULE: typeInstruction = "\nInstruction: This is a Business Rule. Generate exactly one Use Case named 'Validate [Rule Name]' with alternate flows detailing when the rule is violated. Do not generate standard functional flows."; break;
                case SECURITY: typeInstruction = "\nInstruction: This is a Security Requirement. Focus on threat prevention, access control, and data protection. The primary actor for Security Use Cases MUST be 'System' or 'Admin', NOT regular users."; break;
                default: typeInstruction = "\nInstruction: Treat this as a standard Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses."; break;
            }
        } else {
            typeInstruction = "\nInstruction: Treat this as a standard Functional Requirement. Focus on identifying the exact actions the user performs and the system's responses.";
        }
        String reqContext = "Title: " + req.getTitle() + 
            "\nDescription: " + req.getDescription() + 
            "\nType: " + req.getType() + typeInstruction +
            "\nAcceptance Criteria: " + req.getAcceptanceCriteria();
        
        StringBuilder existingUcsContext = new StringBuilder();
        if (existingUseCases.isEmpty()) {
            existingUcsContext.append("None.");
        } else {
            for (org.example.backend.entity.UseCase uc : existingUseCases) {
                String oldActors = "";
                if (uc.getActors() != null) {
                    List<String> actorNames = new ArrayList<>();
                    for (org.example.backend.entity.UseCaseActor actor : uc.getActors()) {
                        actorNames.add(actor.getActorName());
                    }
                    oldActors = String.join(", ", actorNames);
                }

                existingUcsContext.append("--- USE CASE ID: ").append(uc.getId()).append(" ---\n")
                    .append("Name: ").append(uc.getName()).append("\n")
                    .append("Actors: ").append(oldActors).append("\n")
                    .append("Precondition: ").append(uc.getPrecondition()).append("\n")
                    .append("Postcondition: ").append(uc.getPostcondition()).append("\n")
                    .append("Main Flow: ").append(formatFlowForPrompt(uc.getMainFlow())).append("\n")
                    .append("Alternative Flow: ").append(formatFlowForPrompt(uc.getAlternativeFlow())).append("\n\n");
            }
        }
        
        // Prompt AI: Cập nhật HÀNG LOẠT Use Case dựa trên sự thay đổi của Requirement cha.
        // Hướng dẫn AI tự động sửa các Use Case cũ và đề xuất tạo thêm Use Case mới nếu Requirement mở rộng quy mô.
        String prompt = "You are an expert Business Analyst. Below is an updated Requirement and its existing Use Cases.\n" +
            "Your task is to analyze the new Requirement and update the existing Use Cases to match it, AND generate new Use Cases if the Requirement has added new flows not covered by the existing ones.\n" +
            "CRITICAL RULES:\n" +
            "1. Preserve any existing logical flows, edge cases, and manual customizations in the Old Use Cases unless they explicitly contradict the new Requirement.\n" +
            "2. You MUST ADD missing flows or steps if the NEW REQUIREMENT mentions new features, rules, or criteria that are absent in the OLD USE CASE.\n" +
            "3. Your response MUST be a pure JSON object (without ```json wrappers) with EXACTLY two fields: 'updatedUseCases' and 'newUseCases'.\n" +
            "3. 'updatedUseCases' must be an array of objects representing updates to the existing use cases. Each object MUST include 'id' (the integer ID of the use case being updated), 'name', 'precondition', 'postcondition', 'primaryActors', 'mainFlows', 'alternativeFlows', 'startDate', 'deadline'.\n" +
            "4. 'newUseCases' must be an array of objects representing entirely new use cases (do NOT include 'id' field). Format is the same as above.\n" +
            "5. For 'mainFlows': (String) The main success flow, 1 step per line. Number the steps like '1. ...\\n2. ...'\n" +
            "6. For 'alternativeFlows': (String) Alternative or error flows. The number in 'AF[Number]' MUST BE THE EXACT STEP NUMBER from the main flow that it replaces or branches from. For example, if the flow branches from step 7, it MUST be named 'AF7:'. DO NOT name it 'AF1:' unless it branches from step 1. You MUST separate steps with NEWLINES ('\\n'). Example: 'AF7: If user saves as draft:\\n1. System saves privately.\\n2. User exits.' DO NOT write steps on a single line. DO NOT use markdown formatting like `**` or `*`.\n" +
            "7. For 'startDate' and 'deadline': (Strings) Must be logical dates in YYYY-MM-DD format respecting the requirement's dates.\n\n" +
            "STRICT BUSINESS RULE: A Use Case MUST have at least one valid actor in 'primaryActors' if it includes or extends another Use Case. An isolated Use Case without an actor CANNOT include or extend other Use Cases.\n\n" +
            "--- NEW REQUIREMENT ---\n" + reqContext + "\n\n" +
            "--- EXISTING USE CASES ---\n" + existingUcsContext.toString();
            
        String response = geminiService.generateText(prompt);
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper lenientMapper = new com.fasterxml.jackson.databind.ObjectMapper()
                .enable(com.fasterxml.jackson.core.json.JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS.mappedFeature());
            JsonNode root = lenientMapper.readTree(response.trim());
            com.fasterxml.jackson.databind.node.ObjectNode evaluatedRoot = objectMapper.createObjectNode();
            
            if (root.has("updatedUseCases") && root.get("updatedUseCases").isArray() && root.get("updatedUseCases").size() > 0) {
                String evalStr = useCaseGeminiService.evaluateUseCasesWithCritic(root.get("updatedUseCases").toString(), java.util.List.of(req), projectExistingUcs, projectActors);
                evaluatedRoot.set("updatedUseCases", objectMapper.readTree(evalStr));
            } else {
                evaluatedRoot.set("updatedUseCases", objectMapper.createArrayNode());
            }
            
            if (root.has("newUseCases") && root.get("newUseCases").isArray() && root.get("newUseCases").size() > 0) {
                String evalStr = useCaseGeminiService.evaluateUseCasesWithCritic(root.get("newUseCases").toString(), java.util.List.of(req), projectExistingUcs, projectActors);
                evaluatedRoot.set("newUseCases", objectMapper.readTree(evalStr));
            } else {
                evaluatedRoot.set("newUseCases", objectMapper.createArrayNode());
            }
            
            return evaluatedRoot;
        } catch (Exception e) {
            log.error("Failed to parse AI response for sync all preview: {}", response, e);
            throw new RuntimeException("Failed to generate Use Cases preview from AI.");
        }
    }

    @Transactional
    public void applyRequirementSync(Long reqId, JsonNode payload, Long userId) {
        Requirement req = requirementRepository.findById(reqId)
            .orElseThrow(() -> new RuntimeException("Requirement not found"));
        UserAccount user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        Project project = req.getProject();
        
        // Create a staging record for traceability
        AiGenerationStaging staging = new AiGenerationStaging();
        staging.setProject(project);
        staging.setGenerationId(java.util.UUID.randomUUID());
        staging.setStage(AiStage.USE_CASE);
        staging.setStatus(AiGenerationStatus.CONFIRMED);
        staging.setPayload(payload);
        staging.setDocumentText("Synced from Requirement: " + req.getTitle());
        stagingRepository.save(staging);
        
        // 1. Update existing Use Cases
        if (payload.has("updatedUseCases") && payload.get("updatedUseCases").isArray()) {
            for (JsonNode updatedNode : payload.get("updatedUseCases")) {
                if (updatedNode.has("id")) {
                    Long ucId = updatedNode.get("id").asLong();
                    org.example.backend.entity.UseCase uc = useCaseRepository.findById(ucId).orElse(null);
                    if (uc != null) {
                        if (updatedNode.has("name")) uc.setName(updatedNode.get("name").asText());
                        if (updatedNode.has("precondition")) uc.setPrecondition(updatedNode.get("precondition").asText());
                        if (updatedNode.has("postcondition")) uc.setPostcondition(updatedNode.get("postcondition").asText());
                        if (updatedNode.has("startDate") && !updatedNode.get("startDate").isNull() && !updatedNode.get("startDate").asText().equals("N/A")) uc.setStartDate(java.time.LocalDate.parse(updatedNode.get("startDate").asText()));
                        if (updatedNode.has("deadline") && !updatedNode.get("deadline").isNull() && !updatedNode.get("deadline").asText().equals("N/A")) uc.setDeadline(java.time.LocalDate.parse(updatedNode.get("deadline").asText()));
                        
                        if (updatedNode.has("mainFlows")) {
                            String flows = updatedNode.get("mainFlows").asText();
                            try {
                                // Test if it's already a valid JSON object/array string
                                JsonNode flowNode = objectMapper.readTree(flows);
                                if (flowNode.isObject() || flowNode.isArray()) {
                                    uc.setMainFlow(flows); // Save raw JSON string
                                } else {
                                    throw new RuntimeException("Not an object/array");
                                }
                            } catch (Exception e) {
                                // Fallback to plain text splitting with cleanup
                                java.util.List<String> steps = new ArrayList<>();
                                for (String line : flows.split("\n")) {
                                    String trimmed = line.trim();
                                    if (trimmed.isEmpty()) continue;
                                    if (trimmed.startsWith("*") || trimmed.startsWith("-") || trimmed.matches("^[a-z]\\).*")) {
                                        if (!steps.isEmpty()) {
                                            steps.set(steps.size() - 1, steps.get(steps.size() - 1) + "\n  " + trimmed);
                                        } else {
                                            steps.add(trimmed.replaceFirst("^[-*]\\s*", ""));
                                        }
                                    } else {
                                        String cleaned = trimmed.replaceFirst("^(?i)(?:Step\\s*\\d+:?|\\d+[\\.)])\\s*", "");
                                        steps.add(cleaned);
                                    }
                                }
                                Map<String, Object> map = new HashMap<>();
                                map.put("steps", steps);
                                try { uc.setMainFlow(objectMapper.writeValueAsString(map)); } catch (Exception ignored) {}
                            }
                        }
                        
                        if (updatedNode.has("alternativeFlows") || updatedNode.has("alternativeFlow")) {
                            String flows = updatedNode.has("alternativeFlows") ? updatedNode.get("alternativeFlows").asText() : updatedNode.get("alternativeFlow").asText();
                            try {
                                JsonNode flowNode = objectMapper.readTree(flows);
                                if (flowNode.isObject() || flowNode.isArray()) {
                                    uc.setAlternativeFlow(flows);
                                } else {
                                    throw new RuntimeException("Not an object/array");
                                }
                            } catch (Exception e) {
                                java.util.List<String> steps = new ArrayList<>();
                                for (String line : flows.split("\n")) {
                                    String trimmed = line.trim();
                                    if (trimmed.isEmpty()) continue;
                                    if (trimmed.startsWith("*") || trimmed.startsWith("-") || trimmed.matches("^[a-z]\\).*")) {
                                        if (!steps.isEmpty()) {
                                            steps.set(steps.size() - 1, steps.get(steps.size() - 1) + "\n  " + trimmed);
                                        } else {
                                            steps.add(trimmed.replaceFirst("^[-*]\\s*", ""));
                                        }
                                    } else {
                                        String cleaned = trimmed.replaceFirst("^(?i)(?:Step\\s*\\d+:?|\\d+[\\.)])\\s*", "");
                                        steps.add(cleaned);
                                    }
                                }
                                Map<String, Object> singleAltFlow = new HashMap<>();
                                singleAltFlow.put("name", "Alternative Flow");
                                singleAltFlow.put("steps", steps);
                                Map<String, Object> altMap = new HashMap<>();
                                altMap.put("flows", List.of(singleAltFlow));
                                try { uc.setAlternativeFlow(objectMapper.writeValueAsString(altMap)); } catch (Exception ignored) {}
                            }
                        }
                        
                        // Clear outdated flags
                        String reqContentToHash = (req.getTitle() != null ? req.getTitle() : "") + "|" + (req.getDescription() != null ? req.getDescription() : "");
                        String reqHash = org.springframework.util.DigestUtils.md5DigestAsHex(reqContentToHash.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                        uc.setReqVersionHash(reqHash);
                        
                        List<String> includesList = new ArrayList<>();
                        if (updatedNode.has("includes") && updatedNode.get("includes").isArray()) {
                            for (JsonNode incNode : updatedNode.get("includes")) includesList.add(incNode.asText());
                        }
                        if (!includesList.isEmpty() || updatedNode.has("includes")) uc.setIncludesList(includesList);

                        List<String> extendsList = new ArrayList<>();
                        if (updatedNode.has("extendsList") && updatedNode.get("extendsList").isArray()) {
                            for (JsonNode extNode : updatedNode.get("extendsList")) extendsList.add(extNode.asText());
                        }
                        if (!extendsList.isEmpty() || updatedNode.has("extendsList")) uc.setExtendsList(extendsList);
                        
                        useCaseRepository.save(uc);
                    }
                }
            }
        }
        
        // 2. Insert new Use Cases
        if (payload.has("newUseCases") && payload.get("newUseCases").isArray()) {
            Integer maxSubId = useCaseRepository.findMaxProjectSubIdByProjectId(project.getId());
            int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
            
            List<org.example.backend.entity.UseCase> newUcs = new ArrayList<>();
            for (JsonNode newNode : payload.get("newUseCases")) {
                org.example.backend.entity.UseCase uc = new org.example.backend.entity.UseCase();
                uc.setProjectId(project.getId());
                uc.setRequirement(req);
                uc.setName(newNode.has("name") ? newNode.get("name").asText() : "New AI Use Case");
                uc.setPrecondition(newNode.has("precondition") ? newNode.get("precondition").asText() : "");
                uc.setPostcondition(newNode.has("postcondition") ? newNode.get("postcondition").asText() : "");
                uc.setStatus(org.example.backend.entity.UseCaseStatus.DRAFT);
                uc.setProjectSubId(nextSubId);
                uc.setCode(org.example.backend.constant.UseCaseConstants.CODE_PREFIX + project.getId() + org.example.backend.constant.UseCaseConstants.CODE_INFIX + nextSubId);
                uc.setVersion(org.example.backend.constant.UseCaseConstants.DEFAULT_VERSION);
                uc.setCreatedBy(user);
                uc.setAiGenerated(true);
                uc.setSourceGenerationId(staging.getGenerationId());
                uc.setStartDate(newNode.has("startDate") && !newNode.get("startDate").isNull() && !newNode.get("startDate").asText().equals("N/A") ? java.time.LocalDate.parse(newNode.get("startDate").asText()) : req.getStartDate());
                uc.setDeadline(newNode.has("deadline") && !newNode.get("deadline").isNull() && !newNode.get("deadline").asText().equals("N/A") ? java.time.LocalDate.parse(newNode.get("deadline").asText()) : req.getDeadline());
                
                String reqContentToHash = (req.getTitle() != null ? req.getTitle() : "") + "|" + (req.getDescription() != null ? req.getDescription() : "");
                String reqHash = org.springframework.util.DigestUtils.md5DigestAsHex(reqContentToHash.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                uc.setReqVersionHash(reqHash);
                
                if (newNode.has("mainFlows")) {
                    String flows = newNode.get("mainFlows").asText();
                    try {
                        JsonNode flowNode = objectMapper.readTree(flows);
                        if (flowNode.isObject() || flowNode.isArray()) {
                            uc.setMainFlow(flows);
                        } else {
                            throw new RuntimeException("Not an object/array");
                        }
                    } catch (Exception e) {
                        java.util.List<String> steps = new ArrayList<>();
                        for (String line : flows.split("\n")) {
                            String trimmed = line.trim();
                            if (trimmed.isEmpty()) continue;
                            if (trimmed.startsWith("*") || trimmed.startsWith("-") || trimmed.matches("^[a-z]\\).*")) {
                                if (!steps.isEmpty()) {
                                    steps.set(steps.size() - 1, steps.get(steps.size() - 1) + "\n  " + trimmed);
                                } else {
                                    steps.add(trimmed.replaceFirst("^[-*]\\s*", ""));
                                }
                            } else {
                                String cleaned = trimmed.replaceFirst("^(?i)(?:Step\\s*\\d+:?|\\d+[\\.)])\\s*", "");
                                steps.add(cleaned);
                            }
                        }
                        Map<String, Object> map = new HashMap<>();
                        map.put("steps", steps);
                        try { uc.setMainFlow(objectMapper.writeValueAsString(map)); } catch (Exception ignored) {}
                    }
                }
                
                if (newNode.has("alternativeFlows") || newNode.has("alternativeFlow")) {
                    String flows = newNode.has("alternativeFlows") ? newNode.get("alternativeFlows").asText() : newNode.get("alternativeFlow").asText();
                    try {
                        JsonNode flowNode = objectMapper.readTree(flows);
                        if (flowNode.isObject() || flowNode.isArray()) {
                            uc.setAlternativeFlow(flows);
                        } else {
                            throw new RuntimeException("Not an object/array");
                        }
                    } catch (Exception e) {
                        java.util.List<String> steps = new ArrayList<>();
                        for (String line : flows.split("\n")) {
                            String trimmed = line.trim();
                            if (trimmed.isEmpty()) continue;
                            if (trimmed.startsWith("*") || trimmed.startsWith("-") || trimmed.matches("^[a-z]\\).*")) {
                                if (!steps.isEmpty()) {
                                    steps.set(steps.size() - 1, steps.get(steps.size() - 1) + "\n  " + trimmed);
                                } else {
                                    steps.add(trimmed.replaceFirst("^[-*]\\s*", ""));
                                }
                            } else {
                                String cleaned = trimmed.replaceFirst("^(?i)(?:Step\\s*\\d+:?|\\d+[\\.)])\\s*", "");
                                steps.add(cleaned);
                            }
                        }
                        Map<String, Object> singleAltFlow = new HashMap<>();
                        singleAltFlow.put("name", "Alternative Flow");
                        singleAltFlow.put("steps", steps);
                        Map<String, Object> altMap = new HashMap<>();
                        altMap.put("flows", List.of(singleAltFlow));
                        try { uc.setAlternativeFlow(objectMapper.writeValueAsString(altMap)); } catch (Exception ignored) {}
                    }
                }
                
                if (newNode.has("primaryActors") && !newNode.get("primaryActors").asText().trim().isEmpty()) {
                    String[] actorsArr = newNode.get("primaryActors").asText().split(",");
                    List<org.example.backend.entity.UseCaseActor> actorList = new ArrayList<>();
                    for (String actorName : actorsArr) {
                        org.example.backend.entity.UseCaseActor actor = new org.example.backend.entity.UseCaseActor();
                        actor.setActorName(actorName.trim());
                        actor.setUseCase(uc);
                        actorList.add(actor);
                    }
                    uc.setActors(actorList);
                }

                List<String> includesList = new ArrayList<>();
                if (newNode.has("includes") && newNode.get("includes").isArray()) {
                    for (JsonNode incNode : newNode.get("includes")) includesList.add(incNode.asText());
                }
                uc.setIncludesList(includesList);

                List<String> extendsList = new ArrayList<>();
                if (newNode.has("extendsList") && newNode.get("extendsList").isArray()) {
                    for (JsonNode extNode : newNode.get("extendsList")) extendsList.add(extNode.asText());
                }
                uc.setExtendsList(extendsList);
                
                newUcs.add(uc);
                nextSubId++;
            }
            useCaseRepository.saveAll(newUcs);
        }
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<org.example.backend.dto.RequirementResponseDTO> suggestRequirementsForUseCase(Long useCaseId, Long projectId) {
        org.example.backend.entity.UseCase uc = useCaseRepository.findById(useCaseId)
                .orElseThrow(() -> new RuntimeException("Use Case not found: " + useCaseId));
        
        if (projectId == null) {
            projectId = uc.getProjectId();
        }
        List<Requirement> reqs = requirementRepository.findByProjectId(projectId).stream()
                .filter(r -> !"System Architecture Diagram".equals(r.getTitle()))
                .toList();
        
        if (reqs.isEmpty()) {
            return new ArrayList<>();
        }
        
        String actorsStr = uc.getActors() != null ? 
            uc.getActors().stream().map(a -> a.getActorName()).collect(java.util.stream.Collectors.joining(", ")) : "";

        // Prompt AI: Gợi ý các Requirement phù hợp nhất cho một Use Case nháp vừa được tạo trên biểu đồ.
        // Hướng dẫn AI đọc danh sách Requirement hiện có và trả về mảng ID của các Requirement khớp với Use Case này nhất.
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert System Analyst. I have a draft Use Case and a list of existing Requirements in the system.\n");
        prompt.append("Use Case Name: ").append(uc.getName()).append("\n");
        prompt.append("Use Case Actors: ").append(actorsStr).append("\n");
        prompt.append("System Requirements:\n");
        for (Requirement r : reqs) {
            prompt.append("- ID: ").append(r.getId()).append(" | Title: ").append(r.getTitle()).append(" | Desc: ").append(r.getDescription() == null ? "" : r.getDescription()).append("\n");
        }
        prompt.append("Based on the Use Case name and actors, suggest up to 3 most relevant Requirement IDs that this Use Case should belong to.\n");
        prompt.append("Return ONLY a valid JSON array of numbers. E.g. [1, 2, 3]. Do NOT return markdown or any other text.");

        try {
            String aiResponse = geminiService.generateText(prompt.toString());
            // parse JSON array
            if (aiResponse.startsWith("```json")) {
                aiResponse = aiResponse.replace("```json", "").replace("```", "").trim();
            } else if (aiResponse.startsWith("```")) {
                aiResponse = aiResponse.replace("```", "").trim();
            }
            ObjectMapper mapper = new ObjectMapper();
            JsonNode arrayNode = mapper.readTree(aiResponse);
            List<Long> suggestedIds = new ArrayList<>();
            if (arrayNode.isArray()) {
                for (JsonNode n : arrayNode) {
                    suggestedIds.add(n.asLong());
                }
            }
            
            return reqs.stream()
                .filter(r -> suggestedIds.contains(r.getId()))
                .map(r -> org.example.backend.dto.RequirementResponseDTO.builder()
                        .id(r.getId())
                        .title(r.getTitle())
                        .reqCode(r.getReqCode())
                        .description(r.getDescription())
                        .build())
                .toList();
        } catch (Exception e) {
            log.error("Error suggesting requirements", e);
            return new ArrayList<>();
        }
    }
}
