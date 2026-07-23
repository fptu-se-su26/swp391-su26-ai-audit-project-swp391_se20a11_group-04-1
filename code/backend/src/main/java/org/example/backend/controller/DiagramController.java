package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.DiagramSyncRequest;
import org.example.backend.service.DiagramService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/diagrams")
@RequiredArgsConstructor
public class DiagramController {

    private final DiagramService diagramService;

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<ApiResponse<Object>> getDiagramData(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long moduleId,
            @RequestParam(required = false) String activeView) {
        Object data = diagramService.getDiagramData(projectId, moduleId, activeView);
        return ResponseEntity.ok(ApiResponse.success(data, "Diagram data retrieved successfully"));
    }

    @PostMapping("/projects/{projectId}/sync")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> syncDiagramData(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long moduleId,
            @jakarta.validation.Valid @RequestBody DiagramSyncRequest request,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new org.example.backend.exception.CustomException("Please login to continue", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        java.util.Map<String, String> mappings = diagramService.syncDiagramData(projectId, request, userId, moduleId);
        return ResponseEntity.ok(ApiResponse.success(mappings, "Diagram synced successfully"));
    }

    @GetMapping("/projects/{projectId}/layout")
    public ResponseEntity<ApiResponse<Object>> getDiagramLayout(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long moduleId) {
        Object data = diagramService.getDiagramLayout(projectId, moduleId);
        return ResponseEntity.ok(ApiResponse.success(data, "Diagram layout retrieved successfully"));
    }

    @PostMapping("/projects/{projectId}/layout")
    public ResponseEntity<ApiResponse<Void>> saveDiagramLayout(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long moduleId,
            @RequestBody org.example.backend.dto.DiagramSaveRequest request) {
        diagramService.saveDiagramLayout(projectId, moduleId, request);
        return ResponseEntity.ok(ApiResponse.success("Diagram layout saved successfully"));
    }
}
