package org.example.backend.service;

import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;
import org.example.backend.dto.CodeInsightAiReviewResponse;
import org.example.backend.dto.TaskReviewDashboardResponse;
import org.example.backend.dto.TaskReviewDetailResponse;
import org.example.backend.dto.TaskEvidenceResponse;

public interface TaskReviewService {
    // Read repository/settings config for a project member.
    CodeInsightConfigResponse getConfig(Long projectId, Long userId);

    // Update repository/settings config for a project leader.
    CodeInsightConfigResponse updateConfig(Long projectId, CodeInsightConfigRequest request, Long userId);

    // Read linked GitHub evidence for a task in the project.
    TaskEvidenceResponse getTaskEvidence(Long projectId, Long taskId, Long userId);

    // Read full review detail for the dedicated Code Insight task review screen.
    TaskReviewDetailResponse getReviewDetail(Long projectId, Long taskId, Long userId);

    // Fetch and cache changed-file metadata for linked pull requests, then return refreshed evidence.
    TaskEvidenceResponse fetchTaskChangedFiles(Long projectId, Long taskId, Long userId);

    // Create an AI-assisted review summary for a task.
    CodeInsightAiReviewResponse createAiReview(Long projectId, Long taskId, Long userId);

    // Read Code Insight project-level evidence and review dashboard metrics.
    TaskReviewDashboardResponse getDashboard(Long projectId, Long userId);
}
