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

    @Autowired
    public AiGenerationController(AiGenerationService aiGenerationService) {
        this.aiGenerationService = aiGenerationService;
    }

    @PostMapping(value = "/generate-requirements/{projectId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> generateRequirementsFromFile(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file,
            jakarta.servlet.http.HttpSession session) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File không được để trống."));
        }

        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            UUID generationId = aiGenerationService.generateRequirementsFromFile(projectId, file, userId);
            return ResponseEntity.ok(Map.of(
                    "message", "Successfully analyzed file and extracted requirements.",
                    "generationId", generationId.toString()
            ));
        } catch (Exception e) {
            log.error("Error generating requirements: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Có lỗi xảy ra trong quá trình phân tích file."));
        }
    }

    @GetMapping("/staging/{projectId}")
    public ResponseEntity<?> getPendingGenerations(@PathVariable Long projectId) {
        try {
            List<AiGenerationStaging> stagings = aiGenerationService.getPendingGenerations(projectId);
            List<Map<String, Object>> responseList = new ArrayList<>();
            ObjectMapper mapper = new ObjectMapper();
            for (AiGenerationStaging staging : stagings) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", staging.getId());
                map.put("generationId", staging.getGenerationId());
                map.put("status", staging.getStatus());
                map.put("createdAt", staging.getCreatedAt());
                map.put("documentText", staging.getDocumentText());
                map.put("payload", mapper.convertValue(staging.getPayload(), List.class));
                responseList.add(map);
            }
            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            log.error("Error fetching pending generations: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Lỗi khi tải danh sách nháp."));
        }
    }

    @PostMapping("/approve/{generationId}")
    public ResponseEntity<?> approveGeneration(
            @PathVariable UUID generationId,
            @RequestBody Map<String, Object> requestBody,
            jakarta.servlet.http.HttpSession session) {
        try {
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
        } catch (Exception e) {
            log.error("Error approving generation {}: {}", generationId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/regenerate/{generationId}")
    public ResponseEntity<?> regenerateRequirements(
            @PathVariable UUID generationId,
            jakarta.servlet.http.HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            aiGenerationService.regenerateRequirements(generationId, userId);
            return ResponseEntity.ok(Map.of("message", "Đã phân tích lại Requirement thành công."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
