package org.example.backend.controller.testing;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.testing.TestCaseListItemResponse;
import org.example.backend.dto.testing.TestCaseRequest;
import org.example.backend.dto.testing.TestCaseResponse;
import org.example.backend.dto.testing.RequirementTreeNodeResponse;
import org.example.backend.entity.enums.TestCaseStatus;
import org.example.backend.entity.enums.TestType;
import org.example.backend.service.testing.TestCaseService;
import org.example.backend.service.ApiTestExecutorService;
import org.example.backend.service.AiTestCaseGeneratorService;
import org.example.backend.dto.apitest.ApiTestResultResponse;
import org.example.backend.repository.ApiTestResultRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.AiGenerationStaging;
import org.example.backend.entity.AiGenerationStatus;
import org.example.backend.repository.AiGenerationStagingRepository;
import org.example.backend.service.AiGenerationService;
import org.example.backend.service.SelectorEnrichmentService;
import org.example.backend.service.ApiKnowledgeService;
import org.example.backend.repository.RequirementRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.exception.ResourceNotFoundException;
import java.util.UUID;
import java.util.HashMap;
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
    private final AiTestCaseGeneratorService aiTestCaseGeneratorService;
    private final ApiTestResultRepository apiTestResultRepository;
    private final UserAccountRepository userAccountRepository;
    private final AiGenerationStagingRepository aiGenerationStagingRepository;
    private final AiGenerationService aiGenerationService;
    private final ObjectMapper objectMapper;
    private final SelectorEnrichmentService selectorEnrichmentService;
    private final ApiKnowledgeService apiKnowledgeService;
    private final RequirementRepository requirementRepository;

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

    @GetMapping("/requirements-tree")
    @PreAuthorizeProjectMember
    public ApiResponse<List<RequirementTreeNodeResponse>> getRequirementsTree(
            @PathVariable Long projectId) {
        return ApiResponse.success(
            testCaseService.getRequirementsTree(projectId),
            "Requirements tree retrieved successfully"
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
        testCaseService.delete(projectId, testCaseId, user.getId());
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

    @PostMapping("/generate-ai")
    @PreAuthorizeProjectMember
    public ApiResponse<Map<String, Object>> generateTestCasesWithAi(
            @PathVariable Long projectId,
            @Valid @RequestBody org.example.backend.dto.testing.AiTestCaseGenerateRequest request,
            Principal principal) {
        
        UserAccount user = userAccountRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // 1. Validate constraints and save PROCESSING staging
        AiGenerationStaging staging = aiTestCaseGeneratorService.createProcessingStaging(request, projectId);
        
        try {
            // 2. Load requirement once for both enrichment steps
            String enrichReqTitle = "";
            String enrichReqDesc  = "";
            if (request.getRequirementId() != null
                    && (request.isEnrichWithSelectors() || request.isEnrichWithApiKnowledge())) {
                org.example.backend.entity.Requirement enrichReq = requirementRepository
                        .findById(request.getRequirementId()).orElse(null);
                if (enrichReq != null) {
                    enrichReqTitle = enrichReq.getTitle()       != null ? enrichReq.getTitle()       : "";
                    enrichReqDesc  = enrichReq.getDescription() != null ? enrichReq.getDescription() : "";
                }
            }

            // 3. Enrich with real selectors from GitHub source code if requested
            String selectorContext = null;
            if (request.isEnrichWithSelectors()) {
                selectorContext = selectorEnrichmentService.extractSelectorContext(
                        projectId, user.getId(), enrichReqTitle, enrichReqDesc);
            }

            // 4. Enrich with API Knowledge from backend Spring Boot source code if requested
            String apiKnowledgeContext = null;
            if (request.isEnrichWithApiKnowledge()) {
                apiKnowledgeContext = apiKnowledgeService.extractApiKnowledgeContext(
                        projectId, user.getId(), enrichReqTitle, enrichReqDesc);
            }

            // 5. Call Gemini (with optional selectorContext and apiKnowledgeContext)
            org.example.backend.dto.testing.AiTestCaseGenerateResponse generatedData =
                    aiTestCaseGeneratorService.generateTestCases(request, selectorContext, apiKnowledgeContext);
            
            // 4. Update staging to PENDING with payload
            staging.setStatus(AiGenerationStatus.PENDING);
            staging.setPayload(objectMapper.valueToTree(generatedData));
            AiGenerationStaging saved = aiGenerationStagingRepository.save(staging);
            
            Map<String, Object> response = new HashMap<>();
            response.put("generationId", saved.getGenerationId());
            response.put("reasoning", generatedData.getReasoning());
            response.put("coverageSummary", generatedData.getCoverageSummary());
            response.put("testCases", generatedData.getTestCases());

            return ApiResponse.success(response, "Test cases generated successfully by AI");
        } catch (org.example.backend.exception.BusinessException e) {
            // 4. Update staging to DISCARDED on business rule error (e.g. PENDING_EXISTS)
            staging.setStatus(AiGenerationStatus.DISCARDED);
            aiGenerationStagingRepository.save(staging);
            throw e; // Preserve errorCode and message
        } catch (Exception e) {
            // 5. Update staging to DISCARDED on unexpected error
            staging.setStatus(AiGenerationStatus.DISCARDED);
            aiGenerationStagingRepository.save(staging);
            throw new RuntimeException("Failed to process generated test cases", e);
        }
    }

    @GetMapping("/generate-ai/{generationId}")
    @PreAuthorizeProjectMember
    public ApiResponse<Map<String, Object>> getTestCaseGeneration(
            @PathVariable Long projectId,
            @PathVariable UUID generationId) {
        
        List<AiGenerationStaging> stagings = aiGenerationStagingRepository.findByGenerationId(generationId);
        if (stagings.isEmpty()) {
            throw new ResourceNotFoundException("Generation data not found");
        }
        AiGenerationStaging staging = stagings.get(0);
                
        Map<String, Object> response = new HashMap<>();
        response.put("generationId", staging.getGenerationId());
        response.put("testCases", staging.getPayload());
        
        return ApiResponse.success(response, "Test case generation data retrieved successfully");
    }

    @PostMapping("/generate-ai/{generationId}/approve")
    @PreAuthorizeProjectMember
    public ApiResponse<List<TestCaseResponse>> approveTestCaseGeneration(
            @PathVariable Long projectId,
            @PathVariable UUID generationId,
            @RequestBody Map<String, Object> requestBody,
            Principal principal) {
            
        UserAccount user = userAccountRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Long currentUserId = user.getId();

        @SuppressWarnings("unchecked")
        List<Integer> selectedIndices = (List<Integer>) requestBody.get("selectedIndices");
        
        Object payloadObj = requestBody.get("modifiedPayload");
        com.fasterxml.jackson.databind.JsonNode modifiedPayload = null;
        if (payloadObj != null) {
            modifiedPayload = objectMapper.convertValue(payloadObj, com.fasterxml.jackson.databind.JsonNode.class);
        }

        List<TestCaseResponse> testCaseResponses = aiGenerationService.approveTestCaseGeneration(
                generationId, selectedIndices, modifiedPayload, currentUserId, projectId);
                
        return ApiResponse.success(testCaseResponses, "Test cases approved successfully");
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

    @PostMapping("/analyze-coverage")
    @PreAuthorizeProjectMember
    public ApiResponse<String> analyzeCoverage(
            @PathVariable Long projectId,
            @Valid @RequestBody org.example.backend.dto.testing.AnalyzeCoverageRequest request) {
        String analysisResult = aiTestCaseGeneratorService.analyzeCoverage(request.getRequirementId(), projectId);
        return ApiResponse.success(analysisResult, "Coverage analysis completed successfully");
    }

    @PostMapping("/refine-ai")
    @PreAuthorizeProjectMember
    public ApiResponse<List<org.example.backend.dto.testing.AiDraftTestCase>> refineAi(
            @PathVariable Long projectId,
            @Valid @RequestBody org.example.backend.dto.testing.RefineAiRequest request) {
        List<org.example.backend.dto.testing.AiDraftTestCase> refinedTestCases = aiTestCaseGeneratorService.refineTestCases(request);
        return ApiResponse.success(refinedTestCases, "Test cases refined successfully");
    }
}
