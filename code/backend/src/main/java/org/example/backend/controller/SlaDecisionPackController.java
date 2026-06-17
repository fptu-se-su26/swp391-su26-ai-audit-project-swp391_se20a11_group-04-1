package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.SlaDecisionPackResponse;
import org.example.backend.service.sla.SlaDecisionPackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SlaDecisionPackController {

    private final SlaDecisionPackService slaDecisionPackService;

    @GetMapping("/api/v1/projects/{projectId}/tasks/{taskId}/sla-decision-pack")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<SlaDecisionPackResponse>> getTaskDecisionPack(
            @PathVariable Long projectId,
            @PathVariable Long taskId) {
        SlaDecisionPackResponse response = slaDecisionPackService.getTaskDecisionPack(projectId, taskId);
        return ResponseEntity.ok(ApiResponse.success(response, "SLA Decision Pack retrieved successfully"));
    }
}
