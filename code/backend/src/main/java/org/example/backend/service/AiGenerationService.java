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
    private final org.example.backend.repository.ProjectActorRepository projectActorRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public AiGenerationService(DocumentParserService documentParserService,
                               GeminiService geminiService,
                               AiGenerationStagingRepository stagingRepository,
                               ProjectRepository projectRepository,
                               RequirementRepository requirementRepository,
                               org.example.backend.repository.UseCaseRepository useCaseRepository,
                               UserAccountRepository userRepository,
                               org.example.backend.repository.ProjectActorRepository projectActorRepository,
                               ObjectMapper objectMapper) {
        this.documentParserService = documentParserService;
        this.geminiService = geminiService;
        this.stagingRepository = stagingRepository;
        this.projectRepository = projectRepository;
        this.requirementRepository = requirementRepository;
        this.useCaseRepository = useCaseRepository;
        this.userRepository = userRepository;
        this.projectActorRepository = projectActorRepository;
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
            // 2. Call Gemini API to extract requirements JSON
            String rawJsonResponse = geminiService.extractRequirementsFromText(documentText);
            
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
            String criticizedJsonResponse = geminiService.evaluateRequirementsWithCritic(reqsArray.toString(), documentText, contextStrings);

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
        List<String> projectActors = dbActors.stream().map(org.example.backend.entity.ProjectActor::getName).toList();
        
        List<org.example.backend.entity.UseCase> dbUseCases = useCaseRepository.findByProjectId(projectId);
        List<String> existingUseCases = dbUseCases.stream()
                .map(uc -> uc.getCode() != null ? uc.getCode() + ": " + uc.getName() : uc.getName())
                .toList();

        sendProgress(userId, 2, "AI is analyzing requirements and generating Use Cases...");
        String rawJsonResponse = geminiService.generateUseCasesFromRequirements(reqs, projectActors, existingUseCases);

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
        String evaluatedJson = geminiService.evaluateUseCasesWithCritic(payload.toString(), reqs, existingUseCases, projectActors);
        
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
        String criticizedJsonResponse = geminiService.evaluateRequirementsWithCritic(reqsArray.toString(), documentText, contextStrings);

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
        stagingRepository.deleteAll(pending);
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
            JsonNode reqsPayload = stagingPayload != null && stagingPayload.has("requirements") ? stagingPayload.get("requirements") : stagingPayload;
            List<Map<String, Object>> payloadList = objectMapper.convertValue(reqsPayload, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
            if (payloadList != null) {
                for (Map<String, Object> item : payloadList) {
                    String title = (String) item.get("title");
                    if (title != null && lowerCaseTitles.contains(title.toLowerCase())) {
                        item.put("isDuplicate", true);
                    }
                }
            }
            map.put("payload", payloadList);
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
        JsonNode payload = modifiedPayload != null ? modifiedPayload : (stagingPayload != null && stagingPayload.has("requirements") ? stagingPayload.get("requirements") : stagingPayload);
        
        Integer maxSubId = requirementRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        
        // Save actors if present in staging payload
        if (stagingPayload != null && stagingPayload.has("project_actors")) {
            JsonNode actorsNode = stagingPayload.get("project_actors");
            if (actorsNode.isArray()) {
                List<org.example.backend.entity.ProjectActor> existingActors = projectActorRepository.findByProjectId(project.getId());
                java.util.Set<String> existingNames = existingActors.stream()
                        .map(a -> a.getName().toLowerCase())
                        .collect(java.util.stream.Collectors.toSet());
                
                List<org.example.backend.entity.ProjectActor> actorsToSave = new ArrayList<>();
                for (JsonNode actorNode : actorsNode) {
                    String name = actorNode.has("name") ? actorNode.get("name").asText() : "";
                    String desc = actorNode.has("description") ? actorNode.get("description").asText() : "";
                    if (!name.isEmpty() && !existingNames.contains(name.toLowerCase())) {
                        actorsToSave.add(org.example.backend.entity.ProjectActor.builder()
                                .project(project)
                                .name(name)
                                .description(desc)
                                .build());
                        existingNames.add(name.toLowerCase());
                    }
                }
                if (!actorsToSave.isEmpty()) {
                    projectActorRepository.saveAll(actorsToSave);
                }
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
                
                if (req != null) {
                    String reqContentToHash = (req.getTitle() != null ? req.getTitle() : "") + "|" + (req.getDescription() != null ? req.getDescription() : "");
                    String reqHash = org.springframework.util.DigestUtils.md5DigestAsHex(reqContentToHash.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    uc.setReqVersionHash(reqHash);
                }
                
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
                
                List<String> includesList = new ArrayList<>();
                if (ucNode.has("includes") && ucNode.get("includes").isArray()) {
                    for (JsonNode incNode : ucNode.get("includes")) includesList.add(incNode.asText());
                }
                uc.setIncludesList(includesList);

                List<String> extendsList = new ArrayList<>();
                if (ucNode.has("extendsList") && ucNode.get("extendsList").isArray()) {
                    for (JsonNode extNode : ucNode.get("extendsList")) extendsList.add(extNode.asText());
                }
                uc.setExtendsList(extendsList);
                
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
            "   - 'alternativeFlows': (String) Alternative or error flows. The number in 'AF[Number]' MUST BE THE EXACT STEP NUMBER from the main flow that it replaces or branches from. For example, if the flow branches from step 7, it MUST be named 'AF7:'. DO NOT name it 'AF1:' unless it branches from step 1. You MUST separate steps with NEWLINES ('\n'). Example: 'AF7: If user saves as draft:\n1. System saves privately.\n2. User exits.' DO NOT write steps on a single line. DO NOT use markdown formatting like `**` or `*`.\n\n" +
            "STRICT BUSINESS RULE: A Use Case MUST have at least one valid actor in 'primaryActors' if it includes or extends another Use Case. An isolated Use Case without an actor CANNOT include or extend other Use Cases.\n\n" +
            "--- NEW REQUIREMENT ---\n" + reqContext + "\n\n" +
            "--- OLD USE CASE ---\n" + oldUcContext;
            
        String response = geminiService.generateText(prompt);
        response = response.replaceAll("(?s)^.*?```(?:json)?(.*?)```.*$", "$1").trim();
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper lenientMapper = new com.fasterxml.jackson.databind.ObjectMapper()
                .enable(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS);
            JsonNode root = lenientMapper.readTree(response.trim());
            com.fasterxml.jackson.databind.node.ArrayNode arr = objectMapper.createArrayNode();
            arr.add(root);
            String evalStr = geminiService.evaluateUseCasesWithCritic(arr.toString(), java.util.List.of(req), projectExistingUcs, projectActors);
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
        
        String prompt = "You are an expert Business Analyst. Below is an updated Requirement and its existing Use Cases.\n" +
            "Your task is to analyze the new Requirement and update the existing Use Cases to match it, AND generate new Use Cases if the Requirement has added new flows not covered by the existing ones.\n" +
            "CRITICAL RULES:\n" +
            "1. Preserve any existing logical flows, edge cases, and manual customizations in the Old Use Cases unless they explicitly contradict the new Requirement.\n" +
            "2. You MUST ADD missing flows or steps if the NEW REQUIREMENT mentions new features, rules, or criteria that are absent in the OLD USE CASE.\n" +
            "3. Your response MUST be a pure JSON object (without ```json wrappers) with EXACTLY two fields: 'updatedUseCases' and 'newUseCases'.\n" +
            "3. 'updatedUseCases' must be an array of objects representing updates to the existing use cases. Each object MUST include 'id' (the integer ID of the use case being updated), 'name', 'precondition', 'postcondition', 'primaryActors', 'mainFlows', 'alternativeFlows'.\n" +
            "4. 'newUseCases' must be an array of objects representing entirely new use cases (do NOT include 'id' field). Format is the same as above.\n" +
            "5. For 'mainFlows': (String) The main success flow, 1 step per line. Number the steps like '1. ...\n2. ...'\n" +
            "6. For 'alternativeFlows': (String) Alternative or error flows. The number in 'AF[Number]' MUST BE THE EXACT STEP NUMBER from the main flow that it replaces or branches from. For example, if the flow branches from step 7, it MUST be named 'AF7:'. DO NOT name it 'AF1:' unless it branches from step 1. You MUST separate steps with NEWLINES ('\n'). Example: 'AF7: If user saves as draft:\n1. System saves privately.\n2. User exits.' DO NOT write steps on a single line. DO NOT use markdown formatting like `**` or `*`.\n\n" +
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
                .enable(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS);
            JsonNode root = lenientMapper.readTree(response.trim());
            com.fasterxml.jackson.databind.node.ObjectNode evaluatedRoot = objectMapper.createObjectNode();
            
            if (root.has("updatedUseCases") && root.get("updatedUseCases").isArray() && root.get("updatedUseCases").size() > 0) {
                String evalStr = geminiService.evaluateUseCasesWithCritic(root.get("updatedUseCases").toString(), java.util.List.of(req), projectExistingUcs, projectActors);
                evaluatedRoot.set("updatedUseCases", objectMapper.readTree(evalStr));
            } else {
                evaluatedRoot.set("updatedUseCases", objectMapper.createArrayNode());
            }
            
            if (root.has("newUseCases") && root.get("newUseCases").isArray() && root.get("newUseCases").size() > 0) {
                String evalStr = geminiService.evaluateUseCasesWithCritic(root.get("newUseCases").toString(), java.util.List.of(req), projectExistingUcs, projectActors);
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
                        
                        if (updatedNode.has("alternativeFlows")) {
                            String flows = updatedNode.get("alternativeFlows").asText();
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
                
                if (newNode.has("alternativeFlows")) {
                    String flows = newNode.get("alternativeFlows").asText();
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
    public List<org.example.backend.dto.RequirementResponseDTO> suggestRequirementsForUseCase(Long useCaseId) {
        org.example.backend.entity.UseCase uc = useCaseRepository.findById(useCaseId)
                .orElseThrow(() -> new RuntimeException("Use Case not found: " + useCaseId));
        
        Long projectId = uc.getProjectId();
        List<Requirement> reqs = requirementRepository.findByProjectId(projectId).stream()
                .filter(r -> !"System Architecture Diagram".equals(r.getTitle()))
                .toList();
        
        if (reqs.isEmpty()) {
            return new ArrayList<>();
        }
        
        String actorsStr = uc.getActors() != null ? 
            uc.getActors().stream().map(a -> a.getActorName()).collect(java.util.stream.Collectors.joining(", ")) : "";

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
