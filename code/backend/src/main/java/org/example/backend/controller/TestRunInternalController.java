package org.example.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.testing.internal.ExecutionResultRequest;
import org.example.backend.dto.testing.internal.StartExecutionRequest;
import org.example.backend.dto.testing.internal.TestRunExecutionPlan;
import org.example.backend.dto.testing.internal.UpdateTestRunStatusRequest;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.security.InternalServiceKeyValidator;
import org.example.backend.service.TestRunService;
import org.example.backend.service.event.KafkaEventPublisher;
import org.example.backend.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.entity.TestCase;
import org.example.backend.exception.ResourceNotFoundException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/internal/test-runs")
@RequiredArgsConstructor
@Slf4j
public class TestRunInternalController {

    private final TestRunService testRunService;
    private final InternalServiceKeyValidator keyValidator;
    private final TestCaseRepository testCaseRepository;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

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
        // Decrement inflight counter khi worker gửi kết quả về — job đã xong
        try {
            Long remaining = redisTemplate.opsForValue().decrement(KafkaEventPublisher.INFLIGHT_KEY);
            if (remaining != null && remaining < 0) {
                redisTemplate.opsForValue().set(KafkaEventPublisher.INFLIGHT_KEY, "0");
            }
            // Invalidate cache để dashboard cập nhật partition table về trạng thái idle
            redisTemplate.delete("admin:resource:kafkaStatus");
        } catch (Exception e) {
            log.warn("Failed to decrement inflight counter", e);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/test-cases/{testCaseId}")
    public ResponseEntity<Map<String, Object>> getTestCaseDetails(
            @RequestHeader("X-Internal-Service-Key") String internalKey,
            @PathVariable Long testCaseId) {
        validateInternalKey(internalKey);
        
        TestCase tc = testCaseRepository.findById(testCaseId)
            .orElseThrow(() -> new ResourceNotFoundException("TestCase not found"));
            
        Map<String, Object> map = new HashMap<>();
        map.put("title", tc.getTitle());
        map.put("type", tc.getType() != null ? tc.getType().name() : null);
        
        // baseUrl phải lấy từ config của test case — không fallback về localhost
        // vì trong K8s, localhost trỏ vào chính pod của worker chứ không phải app cần test
        String baseUrl = null;
        String stepsStructuredStr = null;
        String cachedScript = null;
        String scriptSource = null;
        
        if (tc.getUiConfig() != null) {
            org.example.backend.entity.config.UiTestConfig uiConfig = tc.getUiConfig();
            if (uiConfig.getBaseUrl() != null && !"null".equals(uiConfig.getBaseUrl()) && !uiConfig.getBaseUrl().isBlank()) baseUrl = uiConfig.getBaseUrl();
            if (uiConfig.getSteps() != null) stepsStructuredStr = uiConfig.getSteps().toString();
            cachedScript = uiConfig.getCachedPlaywrightScript();
            scriptSource = uiConfig.getScriptSource();
        }
        
        map.put("base_url", baseUrl);
        Object parsedSteps = null;
        if (stepsStructuredStr != null) {
            try {
                parsedSteps = objectMapper.readValue(stepsStructuredStr, Object.class);
            } catch (Exception e) {
                parsedSteps = stepsStructuredStr;
            }
        }
        map.put("steps_structured", parsedSteps);
        map.put("expected_result", tc.getExpectedResult());
        map.put("cached_playwright_script", cachedScript);
        map.put("script_source", scriptSource);
        
        return ResponseEntity.ok(map);
    }
}
