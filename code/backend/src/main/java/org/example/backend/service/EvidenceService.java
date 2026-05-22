package org.example.backend.service;

import org.example.backend.dto.EvidenceRequest;
import org.example.backend.dto.EvidenceResponse;
import org.example.backend.dto.EvidenceLinkRequest;
import org.example.backend.dto.EvidenceStatusUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.IOException;

public interface EvidenceService {
    Page<EvidenceResponse> searchEvidence(Long projectId, String keyword, String type, String status, Long uploadedBy, Pageable pageable);
    
    EvidenceResponse getEvidenceById(Long id);
    
    EvidenceResponse createEvidence(EvidenceRequest request) throws IOException;
    
    EvidenceResponse updateEvidence(Long id, EvidenceRequest request) throws IOException;
    
    EvidenceResponse updateEvidenceStatus(Long id, EvidenceStatusUpdateRequest request);
    
    void deleteEvidence(Long id);
    
    EvidenceResponse linkEntity(Long evidenceId, EvidenceLinkRequest request);
    
    void unlinkEntity(Long evidenceId, Long linkId);
}
