package org.example.backend.service;

import org.example.backend.dto.EvidenceSearchResponse;
import org.example.backend.dto.ManualEvidenceLinkRequest;
import org.example.backend.dto.ManualEvidenceLinkResponse;

import java.util.List;

public interface ManualEvidenceLinkService {
    List<ManualEvidenceLinkResponse> list(Long projectId, Long taskId, Long userId);

    ManualEvidenceLinkResponse suggest(Long projectId, Long taskId, ManualEvidenceLinkRequest request, Long userId);

    ManualEvidenceLinkResponse confirm(Long projectId, Long taskId, Long linkId, Long userId);

    ManualEvidenceLinkResponse reject(Long projectId, Long taskId, Long linkId, Long userId);

    EvidenceSearchResponse search(Long projectId, String evidenceType, String query, Long userId);
}
