package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.TaskSlaPauseSummaryResponse;
import org.example.backend.service.sla.TaskSlaPauseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TaskSlaPauseController {

    private final TaskSlaPauseService taskSlaPauseService;

    @GetMapping("/projects/{projectId}/tasks/{taskId}/sla-pause-logs")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<TaskSlaPauseSummaryResponse>> getPauseSummary(
            @PathVariable Long projectId,
            @PathVariable Long taskId) {
        TaskSlaPauseSummaryResponse summary = taskSlaPauseService.getPauseSummary(projectId, taskId);
        return ResponseEntity.ok(ApiResponse.success(summary, "SLA pause summary retrieved successfully"));
    }
}
