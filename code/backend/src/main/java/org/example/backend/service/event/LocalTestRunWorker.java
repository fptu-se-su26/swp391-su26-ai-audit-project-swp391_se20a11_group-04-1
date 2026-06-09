package org.example.backend.service.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.testing.TestRunJobCommand;
import org.example.backend.dto.testing.internal.ExecutionResultRequest;
import org.example.backend.dto.testing.internal.StartExecutionRequest;
import org.example.backend.dto.testing.internal.TestRunExecutionPlan;
import org.example.backend.dto.testing.internal.UpdateTestRunStatusRequest;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.entity.TestCase;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.service.TestRunService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.events.publisher", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class LocalTestRunWorker {

    private final TestRunService testRunService;
    private final TestCaseRepository testCaseRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${playwright.service.url:http://localhost:4001}")
    private String playwrightServiceUrl;

    @EventListener
    @Async
    public void handleTestRunJob(OutboxEvent event) {
        if (!"TEST_RUN_JOB".equals(event.getEventType())) return;
        
        Long testRunId = null;
        try {
            TestRunJobCommand command = objectMapper.readValue(event.getPayload(), TestRunJobCommand.class);
            testRunId = command.testRunId();
            
            log.info("LocalTestRunWorker starting test run orchestration for {}", testRunId);
            TestRunExecutionPlan plan = testRunService.getExecutionPlan(testRunId);
            testRunService.updateTestRunStatus(testRunId, new UpdateTestRunStatusRequest("RUNNING", null));

            for (TestRunExecutionPlan.ExecutionItem execution : plan.executions()) {
                if (!"PENDING".equals(execution.status())) continue;
                
                try {
                    testRunService.startExecution(testRunId, new StartExecutionRequest(execution.executionId(), execution.testCaseId()));
                } catch (org.example.backend.exception.ConflictException e) {
                    log.info("TestRun {} was cancelled/terminated, stopping execution loop", testRunId);
                    return; // graceful stop
                }
                
                TestCase tc = testCaseRepository.findById(execution.testCaseId()).orElse(null);
                if (tc == null) {
                    testRunService.receiveExecutionResult(testRunId, new ExecutionResultRequest(
                        execution.executionId(),
                        execution.testCaseId(),
                        testRunId + "-" + execution.testCaseId(),
                        "FAILED", "Test case not found", null, 0L, null, null
                    ));
                    continue;
                }
                
                String runId = testRunId.toString(); // Use testRunId as runId so frontend WS can connect
                
                Map<String, Object> testCasePayload = new HashMap<>();
                testCasePayload.put("title", tc.getTitle());
                testCasePayload.put("base_url", tc.getBaseUrl() != null ? tc.getBaseUrl() : "http://localhost");
                Object parsedSteps = null;
                if (tc.getStepsStructured() != null) {
                    try {
                        parsedSteps = objectMapper.readValue(tc.getStepsStructured(), Object.class);
                    } catch (Exception e) {
                        parsedSteps = tc.getStepsStructured();
                    }
                }
                testCasePayload.put("steps_structured", parsedSteps);
                testCasePayload.put("expected_result", tc.getExpectedResult());
                testCasePayload.put("cached_playwright_script", tc.getCachedPlaywrightScript());
                testCasePayload.put("script_source", tc.getScriptSource());
                testCasePayload.put("runId", runId);

                Map<String, Object> reqBody = new HashMap<>();
                reqBody.put("testCase", testCasePayload);

                try {
                    log.info("Sending execution request to {}", playwrightServiceUrl);
                    restTemplate.postForEntity(playwrightServiceUrl + "/run", reqBody, String.class);
                    
                    String outcome = "FAILED";
                    Long durationMs = 0L;
                    String notes = null;
                    
                    Integer failedStepIndex = null;
                    java.util.List<String> evidenceUrls = null;
                    
                    // Poll status
                    for (int i = 0; i < 60; i++) { // Max wait 2 minutes
                        try {
                            Thread.sleep(2000);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            log.warn("TestRun polling interrupted for runId {}", runId);
                            break;
                        }
                        try {
                            ResponseEntity<String> statusResp = restTemplate.getForEntity(playwrightServiceUrl + "/status/" + runId, String.class);
                            if (statusResp.getStatusCode().is2xxSuccessful()) {
                                JsonNode node = objectMapper.readTree(statusResp.getBody());
                                String psStatus = node.get("status").asText();
                                if (!"RUNNING".equals(psStatus)) {
                                    outcome = "PASSED".equals(psStatus) ? "PASSED" : "FAILED";
                                    durationMs = node.has("duration") && !node.get("duration").isNull() ? node.get("duration").asLong() : 0L;
                                    if (node.has("error") && !node.get("error").isNull()) {
                                        JsonNode errorNode = node.get("error");
                                        notes = errorNode.has("message") ? errorNode.get("message").asText() : errorNode.asText();
                                    }
                                    if (node.has("failedStepIndex") && !node.get("failedStepIndex").isNull()) {
                                        failedStepIndex = node.get("failedStepIndex").asInt();
                                    }
                                    if (node.has("evidenceUrls") && node.get("evidenceUrls").isArray()) {
                                        evidenceUrls = new java.util.ArrayList<>();
                                        for (JsonNode urlNode : node.get("evidenceUrls")) {
                                            evidenceUrls.add(urlNode.asText());
                                        }
                                    }
                                    break;
                                }
                            }
                        } catch (Exception pollEx) {
                            log.warn("Error polling playwright service: {}", pollEx.getMessage());
                        }
                    }
                    
                    testRunService.receiveExecutionResult(testRunId, new ExecutionResultRequest(
                        execution.executionId(),
                        execution.testCaseId(),
                        testRunId + "-" + execution.testCaseId(), // Idempotency key uses testRunId!
                        outcome, notes, null, durationMs, failedStepIndex, evidenceUrls
                    ));
                    
                } catch (Exception e) {
                    log.error("Failed to call playwright service for test case {}", tc.getId(), e);
                    testRunService.receiveExecutionResult(testRunId, new ExecutionResultRequest(
                        execution.executionId(),
                        execution.testCaseId(),
                        testRunId + "-" + execution.testCaseId(),
                        "FAILED", "Error calling playwright service: " + e.getMessage(), null, 0L, null, null
                    ));
                }
            }
            
            testRunService.updateTestRunStatus(testRunId, new UpdateTestRunStatusRequest("COMPLETED", null));
            
        } catch (Exception e) {
            log.error("Failed to process local test run job", e);
            if (testRunId != null) {
                try {
                    testRunService.updateTestRunStatus(testRunId, new UpdateTestRunStatusRequest("SYSTEM_ERROR", e.getMessage()));
                } catch (Exception ex) {
                    log.error("Failed to mark SYSTEM_ERROR", ex);
                }
            }
        }
    }
}
