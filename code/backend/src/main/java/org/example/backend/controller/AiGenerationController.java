package org.example.backend.controller;

import org.example.backend.service.AiGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import org.example.backend.entity.AiGenerationStaging;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/ai")
public class AiGenerationController {

    private final AiGenerationService aiGenerationService;
    private final org.example.backend.repository.RequirementRepository requirementRepository;

    @Autowired
    public AiGenerationController(AiGenerationService aiGenerationService, org.example.backend.repository.RequirementRepository requirementRepository) {
        this.aiGenerationService = aiGenerationService;
        this.requirementRepository = requirementRepository;
    }

    @PostMapping(value = "/generate-requirements/{projectId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> generateRequirementsFromFile(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file,
            jakarta.servlet.http.HttpSession session) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File không được để trống."));
        }

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        UUID generationId = aiGenerationService.generateRequirementsFromFile(projectId, file, userId);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully analyzed file and extracted requirements.",
                "generationId", generationId.toString()
        ));
    }

    @GetMapping("/debug/last-payload")
    public ResponseEntity<?> getLastPayload() {
        return ResponseEntity.ok(aiGenerationService.getLastPayloadDebug());
    }

    @GetMapping("/staging/{projectId}")
    public ResponseEntity<?> getPendingGenerations(@PathVariable Long projectId) {
        List<Map<String, Object>> responseList = aiGenerationService.getPendingGenerationsWithDuplicateCheck(projectId);
        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/staging/generation/{generationId}")
    public ResponseEntity<?> getGenerationById(@PathVariable UUID generationId) {
        return ResponseEntity.ok(aiGenerationService.getGenerationById(generationId));
    }

    @DeleteMapping("/staging/pending/{projectId}")
    public ResponseEntity<?> deletePendingGenerations(@PathVariable Long projectId, @RequestParam String stage) {
        org.example.backend.entity.AiStage aiStage = org.example.backend.entity.AiStage.valueOf(stage.toUpperCase());
        aiGenerationService.deletePendingGenerations(projectId, aiStage);
        return ResponseEntity.ok(Map.of("message", "Deleted pending generations"));
    }

    @PostMapping("/approve/{generationId}")
    public ResponseEntity<?> approveGeneration(
            @PathVariable UUID generationId,
            @RequestBody Map<String, Object> requestBody,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        @SuppressWarnings("unchecked")
        List<Integer> selectedIndices = (List<Integer>) requestBody.get("selectedIndices");
        
        Object payloadObj = requestBody.get("modifiedPayload");
        com.fasterxml.jackson.databind.JsonNode modifiedPayload = null;
        if (payloadObj != null) {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            modifiedPayload = mapper.convertValue(payloadObj, com.fasterxml.jackson.databind.JsonNode.class);
        }

        aiGenerationService.approveGeneration(generationId, selectedIndices, modifiedPayload, userId);
        return ResponseEntity.ok(Map.of("message", "Đã duyệt và lưu Requirement thành công."));
    }

    @PostMapping("/regenerate/{generationId}")
    public ResponseEntity<?> regenerateRequirements(
            @PathVariable UUID generationId,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        aiGenerationService.regenerateRequirements(generationId, userId);
        return ResponseEntity.ok(Map.of("message", "Đã phân tích lại Requirement thành công."));
    }
    @PostMapping("/generate-use-cases/{projectId}")
    public ResponseEntity<?> generateUseCases(
            @PathVariable Long projectId,
            @RequestBody org.example.backend.dto.AiUseCaseGenerateRequest request,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        UUID generationId = aiGenerationService.generateUseCases(projectId, request.getRequirementIds(), userId);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully started generating Use Cases.",
                "generationId", generationId.toString()
        ));
    }

    @PostMapping("/approve-use-cases/{generationId}")
    public ResponseEntity<?> approveUseCaseGeneration(
            @PathVariable UUID generationId,
            @RequestBody Map<String, Object> requestBody,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        @SuppressWarnings("unchecked")
        List<Integer> selectedIndices = (List<Integer>) requestBody.get("selectedIndices");
        
        Object payloadObj = requestBody.get("modifiedPayload");
        com.fasterxml.jackson.databind.JsonNode modifiedPayload = null;
        if (payloadObj != null) {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            modifiedPayload = mapper.convertValue(payloadObj, com.fasterxml.jackson.databind.JsonNode.class);
        }

        aiGenerationService.approveUseCaseGeneration(generationId, selectedIndices, modifiedPayload, userId);
        return ResponseEntity.ok(Map.of("message", "Đã duyệt và lưu Use Case thành công."));
    }

    @PostMapping("/use-cases/{useCaseId}/sync-preview")
    public ResponseEntity<?> syncUseCasePreview(
            @PathVariable Long useCaseId,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        try {
            com.fasterxml.jackson.databind.JsonNode preview = aiGenerationService.syncUseCasePreview(useCaseId);
            return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(preview.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/requirements/{reqId}/sync-use-cases-preview")
    public ResponseEntity<?> syncAllUseCasesPreview(
            @PathVariable Long reqId,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        try {
            com.fasterxml.jackson.databind.JsonNode preview = aiGenerationService.syncAllUseCasesPreview(reqId);
            return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(preview.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/requirements/{reqId}/apply-use-case-sync")
    public ResponseEntity<?> applyRequirementSync(
            @PathVariable Long reqId,
            @RequestBody Map<String, Object> payloadObj,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode payload = mapper.convertValue(payloadObj, com.fasterxml.jackson.databind.JsonNode.class);
            aiGenerationService.applyRequirementSync(reqId, payload, userId);
            return ResponseEntity.ok(Map.of("message", "Use Cases synchronized successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
