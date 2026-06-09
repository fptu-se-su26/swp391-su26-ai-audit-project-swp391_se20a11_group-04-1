package org.example.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.testing.internal.ExecutionResultRequest;
import org.example.backend.dto.testing.internal.StartExecutionRequest;
import org.example.backend.dto.testing.internal.TestRunExecutionPlan;
import org.example.backend.dto.testing.internal.UpdateTestRunStatusRequest;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.security.InternalServiceKeyValidator;
import org.example.backend.service.TestRunService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/test-runs")
@RequiredArgsConstructor
public class TestRunInternalController {

    private final TestRunService testRunService;
    private final InternalServiceKeyValidator keyValidator;
    private final org.example.backend.repository.TestCaseRepository testCaseRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private void validateInternalKey(String key) {
        if (!keyValidator.isValid(key)) {
            throw new ForbiddenException("Invalid internal service key");
        }
    }

    @GetMapping("/{testRunId}/executions")
    public TestRunExecutionPlan getExecutionPlan(
            @RequestHeader("X-Internal-Service-Key") String internalKey,
            @PathVariable Long testRunId) {
        validateInternalKey(internalKey);
        return testRunService.getExecutionPlan(testRunId);
    }

    @PatchMapping("/{testRunId}/status")
    public ResponseEntity<Void> updateTestRunStatus(
            @RequestHeader("X-Internal-Service-Key") String internalKey,
            @PathVariable Long testRunId,
            @Valid @RequestBody UpdateTestRunStatusRequest request) {
        validateInternalKey(internalKey);
        testRunService.updateTestRunStatus(testRunId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{testRunId}/executions/start")
    public ResponseEntity<Void> startExecution(
            @RequestHeader("X-Internal-Service-Key") String internalKey,
            @PathVariable Long testRunId,
            @Valid @RequestBody StartExecutionRequest request) {
        validateInternalKey(internalKey);
        testRunService.startExecution(testRunId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{testRunId}/executions/{executionId}/result")
    public ResponseEntity<Void> receiveExecutionResult(
            @RequestHeader("X-Internal-Service-Key") String internalKey,
            @PathVariable Long testRunId,
            @PathVariable Long executionId,
            @Valid @RequestBody ExecutionResultRequest request) {
        validateInternalKey(internalKey);
        testRunService.receiveExecutionResult(testRunId, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/test-cases/{testCaseId}")
    public ResponseEntity<java.util.Map<String, Object>> getTestCaseDetails(
            @RequestHeader("X-Internal-Service-Key") String internalKey,
            @PathVariable Long testCaseId) {
        validateInternalKey(internalKey);
        
        org.example.backend.entity.TestCase tc = testCaseRepository.findById(testCaseId)
            .orElseThrow(() -> new org.example.backend.exception.ResourceNotFoundException("TestCase not found"));
            
        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("title", tc.getTitle());
        map.put("base_url", tc.getBaseUrl());
        Object parsedSteps = null;
        if (tc.getStepsStructured() != null) {
            try {
                parsedSteps = objectMapper.readValue(tc.getStepsStructured(), Object.class);
            } catch (Exception e) {
                parsedSteps = tc.getStepsStructured();
            }
        }
        map.put("steps_structured", parsedSteps);
        map.put("expected_result", tc.getExpectedResult());
        map.put("cached_playwright_script", tc.getCachedPlaywrightScript());
        map.put("script_source", tc.getScriptSource());
        
        return ResponseEntity.ok(map);
    }
}
