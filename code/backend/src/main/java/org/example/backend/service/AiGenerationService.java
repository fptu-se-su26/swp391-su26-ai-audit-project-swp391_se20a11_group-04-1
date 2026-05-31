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

import java.util.List;
import java.util.ArrayList;
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
    private final UserAccountRepository userRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public AiGenerationService(DocumentParserService documentParserService,
                               GeminiService geminiService,
                               AiGenerationStagingRepository stagingRepository,
                               ProjectRepository projectRepository,
                               RequirementRepository requirementRepository,
                               UserAccountRepository userRepository,
                               ObjectMapper objectMapper) {
        this.documentParserService = documentParserService;
        this.geminiService = geminiService;
        this.stagingRepository = stagingRepository;
        this.projectRepository = projectRepository;
        this.requirementRepository = requirementRepository;
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

            sendProgress(userId, 1, "AI is analyzing and extracting requirements...");
            // 2. Call Gemini API to extract requirements JSON
            String rawJsonResponse = geminiService.extractRequirementsFromText(documentText);

            sendProgress(userId, 2, "AI Critic is reviewing requirement quality...");
            // 3. Call AI Critic to evaluate
            String criticizedJsonResponse = geminiService.evaluateRequirementsWithCritic(rawJsonResponse, documentText);

            sendProgress(userId, 3, "Finalizing results and saving to database...");
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
                .status(AiGenerationStatus.PENDING)
                .build();

        stagingRepository.save(staging);

        sendProgress(userId, 4, "Done!");
        return generationId;
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
        // Call Gemini API again (bypassing cache)
        String rawJsonResponse = geminiService.extractRequirementsFromText(documentText);

        sendProgress(userId, 2, "AI Critic is reviewing requirement quality...");
        String criticizedJsonResponse = geminiService.evaluateRequirementsWithCritic(rawJsonResponse, documentText);

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

                Requirement requirement = Requirement.builder()
                        .project(staging.getProject())
                        .title(reqNode.has("title") ? reqNode.get("title").asText() : "Untitled Requirement")
                        .description(reqNode.has("description") ? reqNode.get("description").asText() : "")
                        .type(type)
                        .priority(priority)
                        .acceptanceCriteria(acceptanceCriteria)
                        .status(org.example.backend.entity.RequirementStatus.DRAFT)
                        .createdBy(user)
                        .projectSubId(nextSubId)
                        .reqCode("REQ-" + nextSubId)
                        .aiGenerated(true)
                        .build();
                
                nextSubId++;
                requirementsToSave.add(requirement);
            }
        }

        requirementRepository.saveAll(requirementsToSave);
        
        staging.setStatus(AiGenerationStatus.CONFIRMED);
        if (modifiedPayload != null) {
            staging.setPayload(modifiedPayload);
        }
        stagingRepository.save(staging);
    }
}
