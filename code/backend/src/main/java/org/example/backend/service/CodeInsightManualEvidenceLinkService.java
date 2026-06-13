package org.example.backend.service;

import org.example.backend.dto.CodeInsightEvidenceSearchResponse;
import org.example.backend.dto.CodeInsightManualEvidenceLinkRequest;
import org.example.backend.dto.CodeInsightManualEvidenceLinkResponse;

import java.util.List;

public interface CodeInsightManualEvidenceLinkService {
    List<CodeInsightManualEvidenceLinkResponse> list(Long projectId, Long taskId, Long userId);

    CodeInsightManualEvidenceLinkResponse suggest(Long projectId, Long taskId, CodeInsightManualEvidenceLinkRequest request, Long userId);

    CodeInsightManualEvidenceLinkResponse confirm(Long projectId, Long taskId, Long linkId, Long userId);

    CodeInsightManualEvidenceLinkResponse reject(Long projectId, Long taskId, Long linkId, Long userId);

    CodeInsightEvidenceSearchResponse search(Long projectId, String evidenceType, String query, Long userId);
}
