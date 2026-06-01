package org.example.backend.service;

import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;

public interface CodeInsightService {
    // Read repository/settings config for a project member.
    CodeInsightConfigResponse getConfig(Long projectId, Long userId);

    // Update repository/settings config for a project leader.
    CodeInsightConfigResponse updateConfig(Long projectId, CodeInsightConfigRequest request, Long userId);
}
