package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.BusinessModuleRequest;
import org.example.backend.dto.BusinessModuleResponse;
import org.example.backend.service.BusinessModuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/modules")
public class BusinessModuleController {

    @Autowired
    private BusinessModuleService businessModuleService;

    @PostMapping
    public ResponseEntity<ApiResponse<BusinessModuleResponse>> createModule(
            @PathVariable Long projectId,
            @Valid @RequestBody BusinessModuleRequest request,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        BusinessModuleResponse response = businessModuleService.createModule(projectId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Module created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BusinessModuleResponse>> updateModule(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @Valid @RequestBody BusinessModuleRequest request,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        BusinessModuleResponse response = businessModuleService.updateModule(id, projectId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Module updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteModule(
            @PathVariable Long projectId,
            @PathVariable Long id,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        businessModuleService.deleteModule(id, projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Module deleted successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BusinessModuleResponse>>> getModulesByProject(
            @PathVariable Long projectId) {
        List<BusinessModuleResponse> response = businessModuleService.getModulesByProject(projectId);
        return ResponseEntity.ok(ApiResponse.success(response, "Modules retrieved successfully"));
    }

    @PatchMapping("/{id}/assignee")
    public ResponseEntity<ApiResponse<BusinessModuleResponse>> assignMember(
            @PathVariable Long projectId,
            @PathVariable Long id,
            @RequestBody BusinessModuleRequest request,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        BusinessModuleResponse response = businessModuleService.assignMember(id, projectId, request.getAssigneeId(), userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Member assigned successfully"));
    }
}
