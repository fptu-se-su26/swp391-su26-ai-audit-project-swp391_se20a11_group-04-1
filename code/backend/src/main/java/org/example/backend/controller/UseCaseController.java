package org.example.backend.controller;

import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.example.backend.annotation.PreAuthorizeProjectLeader;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.UseCaseRequest;
import org.example.backend.dto.UseCaseResponse;
import org.example.backend.dto.UseCaseStatusUpdateRequest;
import org.example.backend.service.UseCaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import jakarta.servlet.http.HttpSession;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/use-cases")
public class UseCaseController {

    @Autowired
    private UseCaseService useCaseService;

    @PostMapping
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<UseCaseResponse>> createUseCase(@RequestParam Long projectId, @RequestBody UseCaseRequest request, HttpSession session) {
        Long userId = requireUser(session);
        UseCaseResponse response = useCaseService.createUseCase(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Use case created"));
    }

    @GetMapping("/search")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<Page<UseCaseResponse>>> searchUseCases(
            @RequestParam Long projectId,
            @RequestParam(required = false, defaultValue = "") String keyword,
            @RequestParam(required = false, defaultValue = "") String status,
            @RequestParam(required = false) Boolean isDraft,
            @RequestParam(required = false) Boolean mine,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpSession session) {
        String searchKeyword = keyword.isEmpty() ? null : keyword;
        String searchStatus = status.isEmpty() ? null : status;
        Long userId = requireUser(session);
        Long ownerId = (mine != null && mine) ? userId : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("ucOrder").nullsLast(), Sort.Order.desc("id")));
        Page<UseCaseResponse> response = useCaseService.searchUseCases(projectId, searchKeyword, searchStatus, isDraft, ownerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Use cases retrieved"));
    }

    @GetMapping
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<List<UseCaseResponse>>> getAllUseCases(@RequestParam Long projectId) {
        List<UseCaseResponse> response = useCaseService.getAllUseCases(projectId);
        return ResponseEntity.ok(ApiResponse.success(response, "Use cases retrieved"));
    }

    @GetMapping("/{id}")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<UseCaseResponse>> getUseCase(@PathVariable Long id, @RequestParam Long projectId) {
        UseCaseResponse response = useCaseService.getUseCaseById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Use case retrieved"));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorizeProjectLeader
    public ResponseEntity<ApiResponse<UseCaseResponse>> approveUseCase(
            @PathVariable Long id, 
            @RequestParam Long projectId,
            @RequestParam(required = false) Long requirementId,
            @RequestParam(required = false, defaultValue = "BOTH") String type) {
        UseCaseResponse response = useCaseService.approveUseCase(id, projectId, requirementId, type);
        return ResponseEntity.ok(ApiResponse.success(response, "Use case approved"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<UseCaseResponse>> updateUseCaseStatus(@PathVariable Long id, @RequestParam Long projectId, @Valid @RequestBody UseCaseStatusUpdateRequest request) {
        UseCaseResponse response = useCaseService.updateUseCaseStatus(id, projectId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Use case status updated"));
    }

    @PutMapping("/{id}")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<UseCaseResponse>> updateUseCase(@PathVariable Long id, @RequestParam Long projectId, @Valid @RequestBody UseCaseRequest request, HttpSession session) {
        Long userId = requireUser(session);
        UseCaseResponse response = useCaseService.updateUseCase(id, projectId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Use case updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorizeProjectMember
    public ResponseEntity<ApiResponse<Void>> deleteUseCase(@PathVariable Long id, @RequestParam Long projectId, HttpSession session) {
        Long userId = requireUser(session);
        useCaseService.deleteUseCase(id, projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Use case deleted"));
    }

    @PutMapping("/requirement/{requirementId}/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderUseCases(
            @RequestParam Long projectId,
            @PathVariable Long requirementId,
            @RequestBody org.example.backend.dto.ReorderRequestDTO request) {
        useCaseService.reorderUseCases(projectId, requirementId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Use cases reordered"));
    }

    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderUseCasesGlobal(
            @RequestParam Long projectId,
            @RequestBody org.example.backend.dto.ReorderRequestDTO request) {
        useCaseService.reorderUseCasesGlobal(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Use cases reordered globally"));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new org.example.backend.exception.CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
