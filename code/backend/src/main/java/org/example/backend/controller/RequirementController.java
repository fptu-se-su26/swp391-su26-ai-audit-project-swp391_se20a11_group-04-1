package org.example.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.RequirementResponseDTO;
import org.example.backend.service.RequirementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.backend.exception.CustomException;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/requirements")
@RequiredArgsConstructor
public class RequirementController {

    private final RequirementService requirementService;

    @PostMapping
    public ResponseEntity<ApiResponse<RequirementResponseDTO>> createRequirement(@Valid @RequestBody RequirementRequestDTO requestDTO, HttpSession session) {
        Long userId = requireUser(session);
        RequirementResponseDTO responseDTO = requirementService.createRequirement(requestDTO, userId);
        return new ResponseEntity<>(ApiResponse.success(responseDTO, "Requirement created"), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<RequirementResponseDTO>>> getRequirements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = true) Long projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String tag,
            HttpSession session) {
        requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(requirementService.getRequirements(page, size, projectId, status, priority, tag), "Requirements retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RequirementResponseDTO>> getRequirementById(@PathVariable Long id, HttpSession session) {
        requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(requirementService.getRequirementById(id), "Requirement retrieved"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RequirementResponseDTO>> updateRequirement(
            @PathVariable Long id,
            @Valid @RequestBody RequirementRequestDTO requestDTO,
            HttpSession session) {
        requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(requirementService.updateRequirement(id, requestDTO), "Requirement updated"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RequirementResponseDTO>> updateRequirementStatus(
            @PathVariable Long id,
            @RequestParam String status,
            HttpSession session) {
        requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(requirementService.updateRequirementStatus(id, status), "Requirement status updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRequirement(@PathVariable Long id, HttpSession session) {
        requireUser(session);
        requirementService.deleteRequirement(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Requirement deleted"));
    }

    @PutMapping("/project/{projectId}/reorder")
    public ResponseEntity<ApiResponse<Void>> reorderRequirements(
            @PathVariable Long projectId,
            @RequestBody org.example.backend.dto.ReorderRequestDTO request,
            HttpSession session) {
        requireUser(session);
        requirementService.reorderRequirements(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Requirements reordered"));
    }

    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<java.util.List<String>>> getTagsByProject(@RequestParam Long projectId, HttpSession session) {
        requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(requirementService.getTagsByProject(projectId), "Tags retrieved"));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
