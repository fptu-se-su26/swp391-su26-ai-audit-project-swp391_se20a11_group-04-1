package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.SlaDecisionPackResponse;
import org.example.backend.dto.SprintHealthTaskResponse;
import org.example.backend.service.sla.SlaDecisionPackService;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.example.backend.service.sla.SlaPingService;

@RestController
@RequiredArgsConstructor
public class SlaDecisionPackController {

    private final SlaDecisionPackService slaDecisionPackService;
    private final SlaPingService slaPingService;

    @GetMapping("/api/v1/projects/{projectId}/tasks/{taskId}/sla-decision-pack")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<SlaDecisionPackResponse>> getTaskDecisionPack(
            @PathVariable Long projectId,
            @PathVariable Long taskId) {
        SlaDecisionPackResponse response = slaDecisionPackService.getTaskDecisionPack(projectId, taskId);
        return ResponseEntity.ok(ApiResponse.success(response, "SLA Decision Pack retrieved successfully"));
    }

    @GetMapping("/api/v1/projects/{projectId}/sla/sprint-health")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<List<SprintHealthTaskResponse>>> getSprintHealth(
            @PathVariable Long projectId,
            @RequestParam Long sprintId) {
        List<SprintHealthTaskResponse> response = slaDecisionPackService.getSprintHealth(projectId, sprintId);
        return ResponseEntity.ok(ApiResponse.success(response, "Sprint health retrieved successfully"));
    }

    @PostMapping("/api/v1/projects/{projectId}/tasks/{taskId}/ping")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<Void>> pingTask(
            @PathVariable Long projectId,
            @PathVariable Long taskId) {
        slaPingService.pingTask(projectId, taskId);
        return ResponseEntity.ok(ApiResponse.success(null, "Ping notification sent successfully"));
    }

    @PostMapping("/api/v1/projects/{projectId}/sla/sprints/{sprintId}/ping-risk-member")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<Void>> pingRiskMember(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            @RequestParam String assigneeName) {
        slaPingService.pingRiskMember(projectId, sprintId, assigneeName);
        return ResponseEntity.ok(ApiResponse.success(null, "Batch ping notification sent successfully"));
    }
}
