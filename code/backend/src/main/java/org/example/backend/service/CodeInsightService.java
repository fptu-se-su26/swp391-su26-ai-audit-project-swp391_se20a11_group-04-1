package org.example.backend.service;

import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;
import org.example.backend.dto.CodeInsightTaskEvidenceResponse;

public interface CodeInsightService {
    // Read repository/settings config for a project member.
    CodeInsightConfigResponse getConfig(Long projectId, Long userId);

    // Update repository/settings config for a project leader.
    CodeInsightConfigResponse updateConfig(Long projectId, CodeInsightConfigRequest request, Long userId);

    // Read linked GitHub evidence for a task in the project.
    CodeInsightTaskEvidenceResponse getTaskEvidence(Long projectId, Long taskId, Long userId);

    // Fetch and cache changed-file metadata for linked pull requests, then return refreshed evidence.
    CodeInsightTaskEvidenceResponse fetchTaskChangedFiles(Long projectId, Long taskId, Long userId);
}
