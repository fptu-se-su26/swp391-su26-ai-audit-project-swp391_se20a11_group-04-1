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
import org.example.backend.service.ApiTestExecutorService;
import org.example.backend.service.AiApiTestGeneratorService;
import org.example.backend.dto.apitest.ApiTestResultResponse;
import org.example.backend.repository.ApiTestResultRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.ResourceNotFoundException;
import java.util.concurrent.CompletableFuture;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.example.backend.annotation.PreAuthorizeProjectMember;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/test-cases")
@RequiredArgsConstructor
public class TestCaseController {

    private final TestCaseService testCaseService;
    private final ApiTestExecutorService apiTestExecutorService;
    private final AiApiTestGeneratorService aiApiTestGeneratorService;
    private final ApiTestResultRepository apiTestResultRepository;
    private final UserAccountRepository userAccountRepository;

    @PostMapping
    @PreAuthorizeProjectMember
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TestCaseResponse> create(
            @PathVariable Long projectId,
            @Valid @RequestBody TestCaseRequest request,
            Principal principal) {
        
        UserAccount user = userAccountRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long currentUserId = user.getId();

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

        UserAccount user = userAccountRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long currentUserId = user.getId();

        return ApiResponse.success(
            testCaseService.update(projectId, testCaseId, request, currentUserId),
            "Test case updated successfully"
        );
    }

    @DeleteMapping("/{testCaseId}")
    @PreAuthorizeProjectMember
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId,
            Principal principal) {

        UserAccount user = userAccountRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long currentUserId = user.getId();
        testCaseService.delete(projectId, testCaseId, currentUserId);
    }

    @PostMapping("/{testCaseId}/run-api")
    @PreAuthorizeProjectMember
    public CompletableFuture<ApiResponse<ApiTestResultResponse>> runApi(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId,
            @RequestParam(required = false) Long environmentId,
            Principal principal) {

        UserAccount user = userAccountRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long currentUserId = user.getId();

        return apiTestExecutorService.execute(testCaseId, environmentId, currentUserId)
                .thenApply(result -> ApiResponse.success(result, "API test executed successfully"))
                .exceptionally(ex -> {
                    Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
                    if (cause instanceof RuntimeException) {
                        throw (RuntimeException) cause;
                    }
                    throw new RuntimeException(cause);
                });
    }

    @PostMapping("/generate-api")
    @PreAuthorizeProjectMember
    public ApiResponse<TestCaseRequest> generateApiTestFromDescription(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> payload) {
        String description = payload.get("description");
        if (description == null || description.trim().isEmpty()) {
            throw new org.example.backend.exception.BusinessException("Description is required");
        }
        return ApiResponse.success(
            aiApiTestGeneratorService.generateFromDescription(description),
            "API test generated successfully"
        );
    }

    @GetMapping("/{testCaseId}/api-results")
    @PreAuthorizeProjectMember
    public ApiResponse<List<ApiTestResultResponse>> getApiTestResults(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId) {
        
        List<ApiTestResultResponse> results = apiTestResultRepository.findByTestCaseIdAndIsSavedTrueOrderByExecutedAtDesc(testCaseId)
                .stream()
                .map(apiTestExecutorService::mapToResponse)
                .collect(Collectors.toList());

        return ApiResponse.success(results, "API test results retrieved successfully");
    }

    @GetMapping("/{testCaseId}/api-results/{resultId}")
    @PreAuthorizeProjectMember
    public ApiResponse<ApiTestResultResponse> getApiTestResult(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId,
            @PathVariable Long resultId) {
        
        ApiTestResultResponse result = apiTestResultRepository.findByIdAndTestCaseId(resultId, testCaseId)
                .map(apiTestExecutorService::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("API test result not found"));

        return ApiResponse.success(result, "API test result retrieved successfully");
    }

    @PatchMapping("/{testCaseId}/api-results/{resultId}/save")
    @PreAuthorizeProjectMember
    public ApiResponse<ApiTestResultResponse> saveApiTestResult(
            @PathVariable Long projectId,
            @PathVariable Long testCaseId,
            @PathVariable Long resultId) {
        
        org.example.backend.entity.ApiTestResult result = apiTestResultRepository.findByIdAndTestCaseId(resultId, testCaseId)
                .orElseThrow(() -> new ResourceNotFoundException("API test result not found"));

        result.setSaved(true);
        apiTestResultRepository.save(result);

        return ApiResponse.success(apiTestExecutorService.mapToResponse(result), "API test result saved successfully");
    }
}
