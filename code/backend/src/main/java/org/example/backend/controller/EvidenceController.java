package org.example.backend.controller;

import jakarta.validation.Valid;
import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.EvidenceRequest;
import org.example.backend.dto.EvidenceResponse;
import org.example.backend.dto.PageResponse;
import org.example.backend.dto.EvidenceLinkRequest;
import org.example.backend.dto.EvidenceStatusUpdateRequest;
import org.example.backend.service.EvidenceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/evidence")
public class EvidenceController {

    private final EvidenceService evidenceService;

    public EvidenceController(EvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @GetMapping("/search")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<PageResponse<EvidenceResponse>>> searchEvidence(
            @RequestParam Long projectId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long uploadedBy,
            @org.springframework.data.web.PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) 
            Pageable pageable) {
        
        Page<EvidenceResponse> response = evidenceService.searchEvidence(projectId, keyword, type, status, uploadedBy, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(response), "Evidence retrieved successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<EvidenceResponse>> getEvidenceById(@PathVariable Long id, @RequestParam Long projectId) {
        EvidenceResponse response = evidenceService.getEvidenceById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Success"));
    }

    @PostMapping(consumes = {"multipart/form-data"})
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<EvidenceResponse>> createEvidence(
            @RequestParam Long projectId,
            @Valid @ModelAttribute EvidenceRequest request) throws IOException {
        EvidenceResponse response = evidenceService.createEvidence(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Evidence created successfully"));
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<EvidenceResponse>> updateEvidence(
            @PathVariable Long id,
            @RequestParam Long projectId,
            @Valid @ModelAttribute EvidenceRequest request) throws IOException {
        EvidenceResponse response = evidenceService.updateEvidence(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Evidence updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<EvidenceResponse>> updateEvidenceStatus(
            @PathVariable Long id,
            @RequestParam Long projectId,
            @Valid @RequestBody EvidenceStatusUpdateRequest request) {
        EvidenceResponse response = evidenceService.updateEvidenceStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Status updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<Void>> deleteEvidence(@PathVariable Long id, @RequestParam Long projectId) {
        evidenceService.deleteEvidence(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Evidence deleted successfully"));
    }

    @PostMapping("/{id}/links")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<EvidenceResponse>> linkEntity(
            @PathVariable Long id,
            @RequestParam Long projectId,
            @Valid @RequestBody EvidenceLinkRequest request) {
        EvidenceResponse response = evidenceService.linkEntity(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Entity linked successfully"));
    }

    @DeleteMapping("/{id}/links/{linkId}")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<Void>> unlinkEntity(
            @PathVariable Long id,
            @RequestParam Long projectId,
            @PathVariable Long linkId) {
        evidenceService.unlinkEntity(id, linkId);
        return ResponseEntity.ok(ApiResponse.success(null, "Entity unlinked successfully"));
    }
}
