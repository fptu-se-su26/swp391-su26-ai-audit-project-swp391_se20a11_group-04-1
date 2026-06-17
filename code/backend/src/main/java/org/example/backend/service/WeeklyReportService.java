package org.example.backend.service;

import org.example.backend.dto.WeeklyReportResponse;

import java.util.List;

public interface WeeklyReportService {
    List<WeeklyReportResponse> getProjectReports(Long projectId, Long userId);

    WeeklyReportResponse getProjectReport(Long projectId, Long reportId, Long userId);

    WeeklyReportResponse generateProjectReport(Long projectId, Long userId);

    int generateWeeklyReportsForAllProjects();
}
