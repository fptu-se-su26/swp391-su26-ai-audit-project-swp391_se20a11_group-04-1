package org.example.backend.controller;

import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.UseCaseRequest;
import org.example.backend.dto.UseCaseResponse;
import org.example.backend.service.UseCaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

@RestController
@RequestMapping("/api/v1/use-cases")
public class UseCaseController {

    @Autowired
    private UseCaseService useCaseService;

    @PostMapping
    public ResponseEntity<ApiResponse<UseCaseResponse>> createUseCase(@RequestBody UseCaseRequest request, Authentication authentication) {
        String username = authentication.getName();
        UseCaseResponse response = useCaseService.createUseCase(request, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Use case created"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<UseCaseResponse>>> searchUseCases(
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String searchKeyword = keyword.isEmpty() ? null : keyword;
        String searchStatus = status.isEmpty() ? null : status;
        Pageable pageable = PageRequest.of(page, size);
        Page<UseCaseResponse> response = useCaseService.searchUseCases(searchKeyword, searchStatus, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Use cases retrieved"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UseCaseResponse>>> getAllUseCases() {
        List<UseCaseResponse> response = useCaseService.getAllUseCases();
        return ResponseEntity.ok(ApiResponse.success(response, "Use cases retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UseCaseResponse>> getUseCase(@PathVariable Long id) {
        UseCaseResponse response = useCaseService.getUseCaseById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Use case retrieved"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UseCaseResponse>> updateUseCaseStatus(@PathVariable Long id, @RequestBody org.example.backend.dto.UseCaseStatusUpdateRequest request) {
        UseCaseResponse response = useCaseService.updateUseCaseStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(response, "Use case status updated"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UseCaseResponse>> updateUseCase(@PathVariable Long id, @RequestBody UseCaseRequest request) {
        UseCaseResponse response = useCaseService.updateUseCase(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Use case updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUseCase(@PathVariable Long id) {
        useCaseService.deleteUseCase(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Use case deleted"));
    }
}
