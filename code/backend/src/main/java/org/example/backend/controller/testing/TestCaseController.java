package org.example.backend.controller.testing;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.testing.TestCaseListItemResponse;
import org.example.backend.dto.testing.TestCaseRequest;
import org.example.backend.dto.testing.TestCaseResponse;
import org.example.backend.entity.enums.TestCaseStatus;
import org.example.backend.entity.enums.TestType;
import org.example.backend.service.testing.TestCaseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/test-cases")
@RequiredArgsConstructor
public class TestCaseController {

    private final TestCaseService testCaseService;

    @PostMapping
    @PreAuthorizeProjectMember
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TestCaseResponse> create(
            @PathVariable Long projectId,
            @Valid @RequestBody TestCaseRequest request,
            Principal principal) {
        
        // Fallback dummy user ID since security integration might not be complete in this scope
        Long currentUserId = 1L; 

        return ApiResponse.success(
            testCaseService.create(projectId, request, currentUserId),
            "Test case created successfully"
        );
    }

    @GetMapping
    @PreAuthorizeProjectMember
    public ApiResponse<org.example.backend.dto.PageResponse<TestCaseListItemResponse>> list(
            @PathVariable Long projectId,
            @RequestParam(required = false) TestCaseStatus status,
            @RequestParam(required = false) TestType type,
            @RequestParam(required = false) Long requirementId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<TestCaseListItemResponse> page = testCaseService.list(projectId, status, type, requirementId, pageable);
        return ApiResponse.success(
            org.example.backend.dto.PageResponse.from(page),
            "Test cases retrieved successfully"
        );
    }

    @GetMapping("/{testCaseId}")
    @PreAuthorizeProjectMember
    public ApiResponse<TestCaseResponse> getById(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId) {

        return ApiResponse.success(
            testCaseService.getById(projectId, testCaseId),
            "Test case retrieved successfully"
        );
    }

    @PutMapping("/{testCaseId}")
    @PreAuthorizeProjectMember
    public ApiResponse<TestCaseResponse> update(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId,
            @Valid @RequestBody TestCaseRequest request,
            Principal principal) {

        Long currentUserId = 1L;

        return ApiResponse.success(
            testCaseService.update(projectId, testCaseId, request, currentUserId),
            "Test case updated successfully"
        );
    }

    @DeleteMapping("/{testCaseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId,
            Principal principal) {

        Long currentUserId = 1L;
        testCaseService.delete(projectId, testCaseId, currentUserId);
    }
}
