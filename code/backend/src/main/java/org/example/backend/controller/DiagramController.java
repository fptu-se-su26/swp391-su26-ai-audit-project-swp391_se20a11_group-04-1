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
    public ResponseEntity<ApiResponse<Object>> getDiagramData(@PathVariable Long projectId) {
        Object data = diagramService.getDiagramData(projectId);
        return ResponseEntity.ok(ApiResponse.success(data, "Diagram data retrieved successfully"));
    }

    @PostMapping("/projects/{projectId}/sync")
    public ResponseEntity<ApiResponse<Void>> syncDiagramData(
            @PathVariable Long projectId,
            @RequestBody DiagramSyncRequest request) {
        diagramService.syncDiagramData(projectId, request);
        return ResponseEntity.ok(ApiResponse.success("Diagram synced successfully"));
    }

    @GetMapping("/projects/{projectId}/layout")
    public ResponseEntity<ApiResponse<Object>> getDiagramLayout(@PathVariable Long projectId) {
        Object data = diagramService.getDiagramLayout(projectId);
        return ResponseEntity.ok(ApiResponse.success(data, "Diagram layout retrieved successfully"));
    }

    @PostMapping("/projects/{projectId}/layout")
    public ResponseEntity<ApiResponse<Void>> saveDiagramLayout(
            @PathVariable Long projectId,
            @RequestBody org.example.backend.dto.DiagramSaveRequest request) {
        diagramService.saveDiagramLayout(projectId, request);
        return ResponseEntity.ok(ApiResponse.success("Diagram layout saved successfully"));
    }
}
