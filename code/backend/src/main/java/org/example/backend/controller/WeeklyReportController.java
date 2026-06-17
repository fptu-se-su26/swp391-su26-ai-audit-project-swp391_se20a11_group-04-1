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
@RequestMapping("/api/v1/projects/{projectId}/weekly-reports")
@RequiredArgsConstructor
public class WeeklyReportController {

    private final WeeklyReportService weeklyReportService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WeeklyReportResponse>>> getProjectReports(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(
                weeklyReportService.getProjectReports(projectId, userId),
                "Weekly reports retrieved"
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
                "Weekly report retrieved"
        ));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<WeeklyReportResponse>> generateProjectReport(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                weeklyReportService.generateProjectReport(projectId, userId),
                "Weekly report generated"
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
