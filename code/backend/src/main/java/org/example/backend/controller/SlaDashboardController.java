package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.OutboxEventActivityResponse;
import org.example.backend.dto.OutboxSummaryResponse;
import org.example.backend.dto.SchedulerEmailResponse;
import org.example.backend.dto.SchedulerRunResponse;
import org.example.backend.dto.SlaDashboardResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.SlaDashboardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SlaDashboardController {

    private final SlaDashboardService slaDashboardService;

    @GetMapping("/projects/{projectId}/sla-dashboard")
    public ResponseEntity<ApiResponse<SlaDashboardResponse>> getProjectSlaDashboard(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                slaDashboardService.getProjectDashboard(projectId, userId),
                "SLA dashboard retrieved"
        ));
    }

    @GetMapping("/scheduler/runs/latest")
    public ResponseEntity<ApiResponse<List<SchedulerRunResponse>>> getLatestSchedulerRuns(HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                slaDashboardService.getLatestSchedulerRuns(userId),
                "Latest scheduler runs retrieved"
        ));
    }

    @GetMapping("/scheduler/runs/{jobName}/emails")
    public ResponseEntity<ApiResponse<List<SchedulerEmailResponse>>> getSchedulerRunEmails(
            @PathVariable String jobName,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                slaDashboardService.getSchedulerRunEmails(jobName, userId),
                "Scheduler run emails retrieved"
        ));
    }

    @GetMapping("/scheduler/runs/{jobName}/events")
    public ResponseEntity<ApiResponse<List<OutboxEventActivityResponse>>> getSchedulerRunEvents(
            @PathVariable String jobName,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                slaDashboardService.getSchedulerRunEvents(jobName, userId),
                "Scheduler run events retrieved"
        ));
    }

    @GetMapping("/outbox/summary")
    public ResponseEntity<ApiResponse<OutboxSummaryResponse>> getOutboxSummary(HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                slaDashboardService.getOutboxSummary(userId),
                "Outbox summary retrieved"
        ));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
