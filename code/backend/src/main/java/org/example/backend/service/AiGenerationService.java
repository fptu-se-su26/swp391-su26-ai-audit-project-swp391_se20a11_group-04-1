package org.example.backend.service;

import org.example.backend.config.NotificationWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.entity.AiGenerationStaging;
import org.example.backend.entity.AiGenerationStatus;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AiGenerationService {

    private final DocumentParserService documentParserService;
    private final GeminiService geminiService;
    private final AiGenerationStagingRepository stagingRepository;
    private final ProjectRepository projectRepository;
    private final RequirementRepository requirementRepository;
    private final org.example.backend.repository.UseCaseRepository useCaseRepository;
    private final UserAccountRepository userRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public AiGenerationService(DocumentParserService documentParserService,
                               GeminiService geminiService,
                               AiGenerationStagingRepository stagingRepository,
                               ProjectRepository projectRepository,
                               RequirementRepository requirementRepository,
                               org.example.backend.repository.UseCaseRepository useCaseRepository,
                               UserAccountRepository userRepository,
                               ObjectMapper objectMapper) {
        this.documentParserService = documentParserService;
        this.geminiService = geminiService;
        this.stagingRepository = stagingRepository;
        this.projectRepository = projectRepository;
        this.requirementRepository = requirementRepository;
        this.useCaseRepository = useCaseRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public UUID generateRequirementsFromFile(Long projectId, MultipartFile file, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án với ID: " + projectId));

        String fileHash;
        try {
            fileHash = DigestUtils.md5DigestAsHex(file.getBytes());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi đọc file để tạo mã băm: " + e.getMessage(), e);
        }

        sendProgress(userId, 0, "Checking cache for existing file...");
        java.util.Optional<AiGenerationStaging> existingCache = stagingRepository.findFirstByFileHashOrderByCreatedAtDesc(fileHash);
        
        String documentText = null;
        JsonNode payload;
        String contextWarning = null;
        
        if (existingCache.isPresent() && existingCache.get().getPayload() != null) {
            sendProgress(userId, 1, "File exact match found in cache!");
            sendProgress(userId, 2, "Skipping Gemini API analysis...");
            sendProgress(userId, 3, "Restoring previous AI results...");
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
            documentText = documentParserService.parseDocument(file);

            sendProgress(userId, 1, "AI is evaluating document relevance...");
            
            // Lấy 10 Requirement gần nhất làm context
            List<Requirement> contextReqs = requirementRepository.findTop10ByProjectIdAndIsDeletedFalseOrderByCreatedAtDesc(projectId);
            List<String> contextStrings = new ArrayList<>();
            for (Requirement r : contextReqs) {
                contextStrings.add(r.getTitle() + (r.getDescription() != null ? ": " + r.getDescription() : ""));
            }
            
            String evalJson = geminiService.evaluateDocumentContext(contextStrings, documentText);
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

            sendProgress(userId, 2, "AI is analyzing and extracting requirements...");
            // 2. Call Gemini API to extract requirements JSON
            String rawJsonResponse = geminiService.extractRequirementsFromText(documentText);

            sendProgress(userId, 3, "AI Critic is reviewing requirement quality and checking semantics duplicates...");
            // 3. Call AI Critic to evaluate
            String criticizedJsonResponse = geminiService.evaluateRequirementsWithCritic(rawJsonResponse, documentText, contextStrings);

            sendProgress(userId, 4, "Finalizing results and saving to database...");
            // 4. Parse JSON response to ensure it's valid
            try {
                payload = objectMapper.readTree(criticizedJsonResponse);
                if (!payload.isArray()) {
                    log.error("Gemini did not return a valid JSON array. Response: {}", criticizedJsonResponse);
                    throw new RuntimeException("Gemini không trả về danh sách (Array) JSON hợp lệ.");
                }
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

        sendProgress(userId, 1, "AI is analyzing requirements and generating Use Cases...");
        String rawJsonResponse = geminiService.generateUseCasesFromRequirements(reqs);

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
                    String actualReqCode = reqs.get(0).getReqCode();
                    for (JsonNode node : payload) {
                        if (node.isObject()) {
                            ((com.fasterxml.jackson.databind.node.ObjectNode) node).put("requirementId", actualReqId);
                            ((com.fasterxml.jackson.databind.node.ObjectNode) node).put("requirementCode", actualReqCode);
                        }
                    }
                } else {
                    // For multiple requirements, map the requirementId to requirementCode if present
                    java.util.Map<Long, String> reqCodeMap = reqs.stream().collect(java.util.stream.Collectors.toMap(Requirement::getId, Requirement::getReqCode));
                    for (JsonNode node : payload) {
                        if (node.isObject() && node.has("requirementId")) {
                            Long reqId = node.get("requirementId").asLong();
                            if (reqCodeMap.containsKey(reqId)) {
                                ((com.fasterxml.jackson.databind.node.ObjectNode) node).put("requirementCode", reqCodeMap.get(reqId));
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
        String evaluatedJson = geminiService.evaluateUseCasesWithCritic(payload.toString(), reqs);
        
        sendProgress(userId, 4, "Saving draft Use Cases to staging...");
        JsonNode finalPayload;
        try {
            finalPayload = objectMapper.readTree(evaluatedJson);
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
            Object payloadObj = objectMapper.treeToValue(staging.getPayload(), Object.class);
            map.put("payload", payloadObj);
        } catch (Exception e) {
            map.put("payload", staging.getPayload().toString());
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
        String evalJson = geminiService.evaluateDocumentContext(contextStrings, documentText);
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
        String rawJsonResponse = geminiService.extractRequirementsFromText(documentText);

        sendProgress(userId, 2, "AI Critic is reviewing requirement quality and checking semantics duplicates...");
        String criticizedJsonResponse = geminiService.evaluateRequirementsWithCritic(rawJsonResponse, documentText, contextStrings);

        sendProgress(userId, 3, "Finalizing results and updating database...");
        JsonNode newPayload;
        try {
            newPayload = objectMapper.readTree(criticizedJsonResponse);
            if (!newPayload.isArray()) {
                log.error("Gemini did not return a valid JSON array during regeneration. Response: {}", criticizedJsonResponse);
                throw new RuntimeException("Gemini không trả về danh sách JSON hợp lệ.");
            }
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

    public List<AiGenerationStaging> getPendingGenerations(Long projectId) {
        return stagingRepository.findByProjectIdAndStageAndStatusOrderByCreatedAtDesc(projectId, AiStage.REQUIREMENT, AiGenerationStatus.PENDING);
    }

    public Map<String, Object> getLastPayloadDebug() {
        return stagingRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .findFirst()
                .map(staging -> Map.of("id", staging.getId(), "payload", staging.getPayload(), "generationId", staging.getGenerationId()))
                .orElse(Map.of("error", "No staging records found"));
    }

    public List<Map<String, Object>> getPendingGenerationsWithDuplicateCheck(Long projectId) {
        List<AiGenerationStaging> stagings = getPendingGenerations(projectId);
        
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
            
            List<Map<String, Object>> payloadList = objectMapper.convertValue(staging.getPayload(), new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
            if (payloadList != null) {
                for (Map<String, Object> item : payloadList) {
                    String title = (String) item.get("title");
                    if (title != null && lowerCaseTitles.contains(title.toLowerCase())) {
                        item.put("isDuplicate", true);
                    }
                }
            }
            map.put("payload", payloadList);
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
        JsonNode payload = modifiedPayload != null ? modifiedPayload : staging.getPayload();
        
        Integer maxSubId = requirementRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        
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

                Requirement req = Requirement.builder()
                        .project(project)
                        .title(title)
                        .description(description)
                        .type(type)
                        .priority(priority)
                        .acceptanceCriteria(acceptanceCriteria)
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
        
        staging.setStatus(AiGenerationStatus.CONFIRMED);
        if (modifiedPayload != null) {
            staging.setPayload(modifiedPayload);
        }
        stagingRepository.save(staging);
    }

    @Transactional
    public void approveUseCaseGeneration(UUID generationId, List<Integer> selectedIndices, JsonNode modifiedPayload, Long userId) {
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
        JsonNode payload = modifiedPayload != null ? modifiedPayload : staging.getPayload();
        
        Integer maxSubId = useCaseRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        
        List<org.example.backend.entity.UseCase> useCasesToSave = new ArrayList<>();
        
        for (int i = 0; i < payload.size(); i++) {
            if (selectedIndices == null || selectedIndices.contains(i)) {
                JsonNode ucNode = payload.get(i);
                
                String name = ucNode.has("name") ? ucNode.get("name").asText() : "Untitled Use Case";
                String primaryActors = ucNode.has("primaryActors") ? ucNode.get("primaryActors").asText() : "";
                String precondition = ucNode.has("precondition") ? ucNode.get("precondition").asText() : "";
                String postcondition = ucNode.has("postcondition") ? ucNode.get("postcondition").asText() : "";
                String mainSuccessScenario = ucNode.has("mainSuccessScenario") ? ucNode.get("mainSuccessScenario").asText() : "";
                String alternativeFlows = ucNode.has("alternativeFlows") ? ucNode.get("alternativeFlows").asText() : "";
                Long requirementId = ucNode.has("requirementId") ? ucNode.get("requirementId").asLong() : null;

                Requirement req = null;
                if (requirementId != null) {
                    req = requirementRepository.findById(requirementId).orElse(null);
                }

                // Convert text to JSON string as expected by DB & Frontend
                List<String> mainSteps = new ArrayList<>();
                for (String step : mainSuccessScenario.split("\n")) {
                    if (!step.trim().isEmpty()) mainSteps.add(step.trim());
                }
                
                String mainFlowJson = "{\"steps\": []}";
                String altFlowJson = "{\"flows\": []}";
                try {
                    Map<String, Object> mainMap = new HashMap<>();
                    mainMap.put("steps", mainSteps);
                    mainFlowJson = objectMapper.writeValueAsString(mainMap);
                    
                    // Frontend expects alternativeFlow: { flows: [ { name: "Flow A", steps: [...] } ] }
                    // To keep it simple, we wrap the whole text as one flow
                    List<String> altSteps = new ArrayList<>();
                    for (String step : alternativeFlows.split("\n")) {
                        if (!step.trim().isEmpty()) altSteps.add(step.trim());
                    }
                    Map<String, Object> singleAltFlow = new HashMap<>();
                    singleAltFlow.put("name", "Generated Alternative Flow");
                    singleAltFlow.put("steps", altSteps);
                    
                    Map<String, Object> altMap = new HashMap<>();
                    altMap.put("flows", List.of(singleAltFlow));
                    altFlowJson = objectMapper.writeValueAsString(altMap);
                } catch (Exception e) {
                    log.error("Error serializing flow: ", e);
                }

                org.example.backend.entity.UseCase uc = new org.example.backend.entity.UseCase();
                uc.setProjectId(project.getId());
                uc.setRequirement(req);
                uc.setName(name);
                uc.setPrecondition(precondition);
                uc.setPostcondition(postcondition);
                uc.setMainFlow(mainFlowJson);
                uc.setAlternativeFlow(altFlowJson);
                uc.setStatus(org.example.backend.entity.UseCaseStatus.DRAFT);
                uc.setProjectSubId(nextSubId);
                uc.setCode(org.example.backend.constant.UseCaseConstants.CODE_PREFIX + project.getId() + org.example.backend.constant.UseCaseConstants.CODE_INFIX + nextSubId);
                uc.setVersion(org.example.backend.constant.UseCaseConstants.DEFAULT_VERSION);
                uc.setCreatedBy(user);
                uc.setAiGenerated(true);
                uc.setSourceGenerationId(generationId);
                
                // Add actors if primaryActors is provided
                if (primaryActors != null && !primaryActors.trim().isEmpty()) {
                    String[] actorsArr = primaryActors.split(",");
                    List<org.example.backend.entity.UseCaseActor> actorList = new ArrayList<>();
                    for (String actorName : actorsArr) {
                        org.example.backend.entity.UseCaseActor actor = new org.example.backend.entity.UseCaseActor();
                        actor.setActorName(actorName.trim());
                        actor.setUseCase(uc);
                        actorList.add(actor);
                    }
                    uc.setActors(actorList);
                }
                
                nextSubId++;
                useCasesToSave.add(uc);
            }
        }

        useCaseRepository.saveAll(useCasesToSave);
        
        staging.setStatus(AiGenerationStatus.CONFIRMED);
        if (modifiedPayload != null) {
            staging.setPayload(modifiedPayload);
        }
        stagingRepository.save(staging);
    }
}
