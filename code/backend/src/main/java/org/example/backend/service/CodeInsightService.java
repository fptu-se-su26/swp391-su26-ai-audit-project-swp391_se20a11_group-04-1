package org.example.backend.service;

import org.example.backend.dto.CodeInsightConfigRequest;
import org.example.backend.dto.CodeInsightConfigResponse;

public interface CodeInsightService {
    CodeInsightConfigResponse getConfig(Long projectId, Long userId);
    CodeInsightConfigResponse updateConfig(Long projectId, CodeInsightConfigRequest request, Long userId);
}
