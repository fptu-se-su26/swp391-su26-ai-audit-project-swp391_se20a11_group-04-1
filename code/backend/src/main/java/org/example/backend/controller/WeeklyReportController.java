package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.WeeklyReportResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.WeeklyReportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({
        "/api/v1/projects/{projectId}/weekly-reports",
        "/api/v1/projects/{projectId}/sprint-reports"
})
@RequiredArgsConstructor
public class WeeklyReportController {

    private final WeeklyReportService weeklyReportService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WeeklyReportResponse>>> getProjectReports(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long sprintId,
            HttpSession session) {
        Long userId = requireUser(session);
        List<WeeklyReportResponse> reports = sprintId != null
                ? weeklyReportService.getSprintReports(projectId, sprintId, userId)
                : weeklyReportService.getProjectReports(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(
                reports,
                sprintId != null ? "Sprint reports retrieved" : "Sprint reports retrieved"
        ));
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ApiResponse<WeeklyReportResponse>> getProjectReport(
            @PathVariable Long projectId,
            @PathVariable Long reportId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                weeklyReportService.getProjectReport(projectId, reportId, userId),
                "Sprint report retrieved"
        ));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<WeeklyReportResponse>> generateProjectReport(
            @PathVariable Long projectId,
            @RequestParam(required = false) Long sprintId,
            HttpSession session) {
        Long userId = requireUser(session);
        WeeklyReportResponse report = sprintId != null
                ? weeklyReportService.generateSprintReport(projectId, sprintId, userId)
                : weeklyReportService.generateProjectReport(projectId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                report,
                sprintId != null ? "Sprint report generated" : "Sprint report generated"
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
