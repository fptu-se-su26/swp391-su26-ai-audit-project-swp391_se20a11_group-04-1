package org.example.backend.service;

import org.example.backend.dto.OutboxSummaryResponse;
import org.example.backend.dto.OutboxEventActivityResponse;
import org.example.backend.dto.SchedulerEmailResponse;
import org.example.backend.dto.SchedulerRunResponse;
import org.example.backend.dto.SlaDashboardResponse;

import java.util.List;

public interface SlaDashboardService {
    SlaDashboardResponse getProjectDashboard(Long projectId, Long userId);

    List<SchedulerRunResponse> getLatestSchedulerRuns(Long userId);

    List<SchedulerEmailResponse> getSchedulerRunEmails(String jobName, Long userId);

    List<OutboxEventActivityResponse> getSchedulerRunEvents(String jobName, Long userId);

    OutboxSummaryResponse getOutboxSummary(Long userId);
}
