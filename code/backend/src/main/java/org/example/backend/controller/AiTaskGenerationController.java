package org.example.backend.controller;

import org.example.backend.dto.AiTaskGenerateRequest;
import org.example.backend.service.AiTaskGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/ai/tasks")
public class AiTaskGenerationController {

    private final AiTaskGenerationService aiTaskGenerationService;

    @Autowired
    public AiTaskGenerationController(AiTaskGenerationService aiTaskGenerationService) {
        this.aiTaskGenerationService = aiTaskGenerationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateTasks(
            @PathVariable Long projectId,
            @RequestBody AiTaskGenerateRequest request,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        UUID generationId = aiTaskGenerationService.generateTasks(projectId, request, userId);
        return ResponseEntity.ok(Map.of(
                "message", "Successfully started generating Tasks.",
                "generationId", generationId.toString()
        ));
    }

    @PostMapping("/split")
    public ResponseEntity<?> splitTask(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> payload,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Map<String, Object> taskData = (Map<String, Object>) payload.get("task");
        if (taskData == null) {
            taskData = payload; // fallback if frontend sends flat object
        }
        return ResponseEntity.ok(aiTaskGenerationService.splitTask(projectId, taskData, userId));
    }

    @PostMapping("/merge")
    public ResponseEntity<?> mergeTasks(
            @PathVariable Long projectId,
            @RequestBody Map<String, Object> payload,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        List<Map<String, Object>> tasksData = (List<Map<String, Object>>) payload.get("tasks");
        if (tasksData == null || tasksData.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing or empty tasks list"));
        }
        return ResponseEntity.ok(aiTaskGenerationService.mergeTasks(projectId, tasksData, userId));
    }

    @PostMapping("/approve/{generationId}")
    public ResponseEntity<?> approveTaskGeneration(
            @PathVariable Long projectId,
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

        aiTaskGenerationService.approveTaskGeneration(projectId, generationId, selectedIndices, modifiedPayload, userId);
        return ResponseEntity.ok(Map.of("message", "Đã duyệt và lưu Task thành công."));
    }
}
