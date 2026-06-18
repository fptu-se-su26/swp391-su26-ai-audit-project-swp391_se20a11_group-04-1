package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.SlaAnalysisJobResponse;
import org.example.backend.dto.SlaReliabilityReportResponse;
import org.example.backend.entity.SlaAnalysisJob;
import org.example.backend.service.sla.SlaAnalysisJobService;
import org.example.backend.service.sla.SlaReliabilityMetricsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SlaReliabilityController {

    private final SlaReliabilityMetricsService reliabilityMetricsService;
    private final SlaAnalysisJobService slaAnalysisJobService;

    /**
     * GET /api/v1/projects/{projectId}/sprints/{sprintId}/reliability
     *
     * Returns cached snapshot if available. Pass ?refresh=true to force recomputation.
     */
    @GetMapping("/api/v1/projects/{projectId}/sprints/{sprintId}/reliability")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<SlaReliabilityReportResponse>> getReliabilityReport(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            @RequestParam(defaultValue = "false") boolean refresh) {

        SlaReliabilityReportResponse response =
                reliabilityMetricsService.getOrComputeReport(projectId, sprintId, refresh);

        return ResponseEntity.ok(ApiResponse.success(response,
                "Reliability report retrieved successfully"));
    }

    @PostMapping("/api/v1/projects/{projectId}/sprints/{sprintId}/reliability/jobs")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<SlaAnalysisJobResponse>> createAnalysisJob(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            jakarta.servlet.http.HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        SlaAnalysisJob job = slaAnalysisJobService.createJob(projectId, sprintId, userId);
        slaAnalysisJobService.runJobAsync(job.getId());
        
        return ResponseEntity.ok(ApiResponse.success(SlaAnalysisJobResponse.fromEntity(job), "SLA Analysis Job queued"));
    }

    @GetMapping("/api/v1/projects/{projectId}/sprints/{sprintId}/reliability/jobs/{jobId}")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<SlaAnalysisJobResponse>> getAnalysisJobStatus(
            @PathVariable Long projectId,
            @PathVariable Long sprintId,
            @PathVariable Long jobId) {
        
        SlaAnalysisJob job = slaAnalysisJobService.getJob(jobId).orElse(null);
        if (job == null
                || !job.getProjectId().equals(projectId)
                || !job.getSprintId().equals(sprintId)) {
            return ResponseEntity.status(404).body(ApiResponse.error("Job not found"));
        }

        SlaAnalysisJobResponse response = SlaAnalysisJobResponse.fromEntity(job);

        if ("DONE".equals(job.getStatus())) {
            SlaReliabilityReportResponse report = reliabilityMetricsService.getOrComputeReport(projectId, sprintId, false);
            response.setReport(report);
        }

        return ResponseEntity.ok(ApiResponse.success(response, "Job status retrieved"));
    }
}
