package org.example.backend.controller;

import jakarta.validation.Valid;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.EvidenceRequest;
import org.example.backend.dto.EvidenceResponse;
import org.example.backend.dto.EvidenceLinkRequest;
import org.example.backend.dto.EvidenceStatusUpdateRequest;
import org.example.backend.service.EvidenceService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/evidence")
public class EvidenceController {

    private final EvidenceService evidenceService;

    public EvidenceController(EvidenceService evidenceService) {
        this.evidenceService = evidenceService;
    }

    @GetMapping("/test-evidence")
    public String testEvidence() {
        try {
            evidenceService.searchEvidence(null, null, null, org.springframework.data.domain.PageRequest.of(0, 10));
            return "SUCCESS";
        } catch (Exception e) {
            java.io.StringWriter sw = new java.io.StringWriter();
            e.printStackTrace(new java.io.PrintWriter(sw));
            return sw.toString();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<EvidenceResponse>>> searchEvidence(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        Page<EvidenceResponse> response = evidenceService.searchEvidence(keyword, type, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Success"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EvidenceResponse>> getEvidenceById(@PathVariable Long id) {
        EvidenceResponse response = evidenceService.getEvidenceById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Success"));
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<EvidenceResponse>> createEvidence(
            @Valid @ModelAttribute EvidenceRequest request) throws IOException {
        EvidenceResponse response = evidenceService.createEvidence(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Evidence created successfully"));
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<EvidenceResponse>> updateEvidence(
            @PathVariable Long id,
            @Valid @ModelAttribute EvidenceRequest request) throws IOException {
        EvidenceResponse response = evidenceService.updateEvidence(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Evidence updated successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EvidenceResponse>> updateEvidenceStatus(
            @PathVariable Long id,
            @Valid @RequestBody EvidenceStatusUpdateRequest request) {
        EvidenceResponse response = evidenceService.updateEvidenceStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Status updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvidence(@PathVariable Long id) {
        evidenceService.deleteEvidence(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Evidence deleted successfully"));
    }

    @PostMapping("/{id}/links")
    public ResponseEntity<ApiResponse<EvidenceResponse>> linkEntity(
            @PathVariable Long id,
            @Valid @RequestBody EvidenceLinkRequest request) {
        EvidenceResponse response = evidenceService.linkEntity(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Entity linked successfully"));
    }

    @DeleteMapping("/{id}/links/{linkId}")
    public ResponseEntity<ApiResponse<Void>> unlinkEntity(
            @PathVariable Long id,
            @PathVariable Long linkId) {
        evidenceService.unlinkEntity(id, linkId);
        return ResponseEntity.ok(ApiResponse.success(null, "Entity unlinked successfully"));
    }
}
