package org.example.backend.service.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.AgentTaskCreateDTO;
import org.example.backend.dto.AgentTaskStatusResponseDTO;
import org.example.backend.dto.testing.TestRunJobCommand;
import org.example.backend.dto.testing.internal.ExecutionResultRequest;
import org.example.backend.dto.testing.internal.StartExecutionRequest;
import org.example.backend.dto.testing.internal.TestRunExecutionPlan;
import org.example.backend.dto.testing.internal.UpdateTestRunStatusRequest;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.entity.TestCase;
import org.example.backend.entity.enums.AgentTaskStatus;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.service.AgentTaskService;
import org.example.backend.service.TestRunService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
@ConditionalOnProperty(name = "app.events.publisher", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class LocalTestRunWorker {

    private final TestRunService testRunService;
    private final TestCaseRepository testCaseRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final AgentTaskService agentTaskService;

    @Value("${playwright.service.url:http://localhost:4001}")
    private String playwrightServiceUrl;

    @EventListener
    @Async
    public void handleTestRunJob(OutboxEvent event) {
        if (!"TEST_RUN_JOB".equals(event.getEventType())) return;
        
        Long testRunId = null;
        Long projectId = null;
        try {
            TestRunJobCommand command = objectMapper.readValue(event.getPayload(), TestRunJobCommand.class);
            testRunId = command.testRunId();
            projectId = command.projectId();
            
            log.info("LocalTestRunWorker starting test run orchestration for {}", testRunId);
            
            try {
                testRunService.updateTestRunStatus(testRunId, new UpdateTestRunStatusRequest("RUNNING", null));
            } catch (org.example.backend.exception.ConflictException e) {
                log.info("TestRun {} already started by another worker, skipping (race condition guard)", testRunId);
                return;
            }

            TestRunExecutionPlan plan = testRunService.getExecutionPlan(testRunId);

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
                        testRunId + "-" + execution.executionId(),
                        "FAILED", "Test case not found", null, 0L, null, null
                    ));
                    continue;
                }
                
                String baseUrl = tc.getBaseUrl() != null ? tc.getBaseUrl() : "http://localhost";

                // ─── Route Decision: Local Agent vs Cloud Playwright ───
                if (isLocalUrl(baseUrl) && projectId != null) {
                    log.info("URL is localhost — delegating to Local Agent for testCase {}", tc.getId());
                    executeViaLocalAgent(testRunId, execution, tc, projectId);
                } else {
                    log.info("URL is remote — using cloud playwright-service for testCase {}", tc.getId());
                    executeViaPlaywrightService(testRunId, execution, tc);
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

    // ─── Local Agent Delegation ──────────────────────────────────
    private void executeViaLocalAgent(Long testRunId, TestRunExecutionPlan.ExecutionItem execution, TestCase tc, Long projectId) {
        long startTime = System.currentTimeMillis();
        String outcome = "FAILED";
        String notes = null;
        Long durationMs = 0L;
        Integer failedStepIndex = null;
        List<String> evidenceUrls = null;

        try {
            // Generate a Playwright script WITH WebSocket/CDP screencast
            String runId = testRunId + "-" + execution.executionId();
            String script = generateSimpleScript(tc, runId);

            // Create AgentTask for the local agent to pick up
            AgentTaskCreateDTO createDTO = new AgentTaskCreateDTO();
            createDTO.setTestRunId(testRunId);
            createDTO.setExecutionId(execution.executionId());
            createDTO.setProjectId(projectId);
            createDTO.setScript(script);
            createDTO.setBaseUrl(tc.getBaseUrl());

            UUID agentTaskId = agentTaskService.createAgentTask(createDTO);
            log.info("Created AgentTask {} for testCase {} — waiting for local agent to pick it up", agentTaskId, tc.getId());

            // Poll AgentTask status until completed or timeout (5 min)
            long timeout = 5 * 60 * 1000L;
            long pollInterval = 3000L;
            boolean reachedTerminal = false;

            while (System.currentTimeMillis() - startTime < timeout) {
                Thread.sleep(pollInterval);
                AgentTaskStatusResponseDTO taskStatus = agentTaskService.getAgentTaskStatus(agentTaskId);
                log.debug("Polling AgentTask {} — status: {}", agentTaskId, taskStatus.getStatus());

                if (taskStatus.getStatus() == AgentTaskStatus.COMPLETED) {
                    reachedTerminal = true;
                    JsonNode result = taskStatus.getResult();
                    if (result != null) {
                        // ─── DIAGNOSTIC LOG — xóa sau khi debug xong ───
                        log.info("▶▶▶ AgentTask COMPLETED raw result JSON: {}", result.toString());
                        // ─── END DIAGNOSTIC ───
                        outcome = result.has("outcome") && !result.get("outcome").isNull() ? result.get("outcome").asText("FAILED") : "FAILED";
                        if ("FAILED".equals(outcome) && result.has("status") && !result.get("status").isNull()) {
                            String agentStatus = result.get("status").asText();
                            if ("PASS".equalsIgnoreCase(agentStatus) || "PASSED".equalsIgnoreCase(agentStatus)) {
                                outcome = "PASSED";
                            }
                        }

                        notes = result.has("notes") && !result.get("notes").isNull() ? result.get("notes").asText() : null;
                        if ((notes == null || notes.isEmpty()) && result.has("error") && !result.get("error").isNull()) {
                            JsonNode errorNode = result.get("error");
                            notes = errorNode.isObject() && errorNode.has("message") ? errorNode.get("message").asText() : errorNode.asText();
                        }

                        durationMs = result.has("durationMs") && !result.get("durationMs").isNull() ? result.get("durationMs").asLong(0) : -1L;
                        if (durationMs == -1L && result.has("duration") && !result.get("duration").isNull()) {
                            durationMs = result.get("duration").asLong(0);
                        }
                        if (durationMs == -1L) {
                            durationMs = System.currentTimeMillis() - startTime;
                        }
                        if (result.has("failedStepIndex") && !result.get("failedStepIndex").isNull()) {
                            failedStepIndex = result.get("failedStepIndex").asInt();
                        }
                        if (result.has("evidenceUrls") && result.get("evidenceUrls").isArray()) {
                            evidenceUrls = new ArrayList<>();
                            for (JsonNode urlNode : result.get("evidenceUrls")) {
                                evidenceUrls.add(urlNode.asText());
                            }
                        }
                        log.info("AgentTask {} COMPLETED — outcome={}, failedStepIndex={}, notes={}", 
                                agentTaskId, outcome, failedStepIndex, notes != null ? notes.substring(0, Math.min(notes.length(), 200)) : "null");
                    } else {
                        log.warn("AgentTask {} COMPLETED but result is NULL — defaulting to FAILED", agentTaskId);
                    }
                    break;
                }

                if (taskStatus.getStatus() == AgentTaskStatus.TIMEOUT || taskStatus.getStatus() == AgentTaskStatus.FAILED) {
                    reachedTerminal = true;
                    outcome = "FAILED";
                    notes = "Agent task " + taskStatus.getStatus().name() + ". Hãy đảm bảo DevTrack Agent đang chạy trên máy local.";
                    durationMs = System.currentTimeMillis() - startTime;
                    log.warn("AgentTask {} reached terminal status {} before completing", agentTaskId, taskStatus.getStatus());
                    break;
                }
            }

            if (!reachedTerminal) {
                outcome = "FAILED";
                notes = "Local Agent không phản hồi trong 5 phút. Hãy đảm bảo Agent đang chạy.";
                durationMs = System.currentTimeMillis() - startTime;
                log.error("AgentTask {} TIMED OUT after 5 min — agent may have failed to submit result", agentTaskId);
            } else if ("FAILED".equals(outcome) && notes == null) {
                notes = "Execution failed with no error message provided.";
            }

        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            outcome = "FAILED";
            notes = "Polling interrupted";
            durationMs = System.currentTimeMillis() - startTime;
        } catch (Exception e) {
            log.error("Error delegating to local agent for testCase {}", tc.getId(), e);
            outcome = "FAILED";
            notes = "Error creating agent task: " + e.getMessage();
            durationMs = System.currentTimeMillis() - startTime;
        }

        log.info("Submitting execution result for testRun={}, execution={}: outcome={}, failedStepIndex={}", 
                testRunId, execution.executionId(), outcome, failedStepIndex);
        testRunService.receiveExecutionResult(testRunId, new ExecutionResultRequest(
            execution.executionId(),
            execution.testCaseId(),
            testRunId + "-" + execution.executionId(),
            outcome, notes, null, durationMs, failedStepIndex, evidenceUrls
        ));
    }

    // ─── Cloud Playwright Service Execution (existing logic) ─────
    private void executeViaPlaywrightService(Long testRunId, TestRunExecutionPlan.ExecutionItem execution, TestCase tc) {
        String runId = testRunId + "-" + execution.executionId();
        
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
            List<String> evidenceUrls = null;
            
            // Poll status
            for (int i = 0; i < 60; i++) {
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
                                if (errorNode.has("failedStepIndex") && !errorNode.get("failedStepIndex").isNull()) {
                                    failedStepIndex = errorNode.get("failedStepIndex").asInt();
                                }
                            }
                            if (node.has("evidenceUrls") && node.get("evidenceUrls").isArray()) {
                                evidenceUrls = new ArrayList<>();
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
                testRunId + "-" + execution.executionId(),
                outcome, notes, null, durationMs, failedStepIndex, evidenceUrls
            ));
            
        } catch (Exception e) {
            log.error("Failed to call playwright service for test case {}", tc.getId(), e);
            testRunService.receiveExecutionResult(testRunId, new ExecutionResultRequest(
                execution.executionId(),
                execution.testCaseId(),
                testRunId + "-" + execution.executionId(),
                "FAILED", "Error calling playwright service: " + e.getMessage(), null, 0L, null, null
            ));
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────
    private boolean isLocalUrl(String url) {
        if (url == null) return false;
        return url.contains("localhost") || url.contains("127.0.0.1") || url.contains("0.0.0.0");
    }

    /**
     * Generate a Playwright test script WITH WebSocket/CDP screencast support.
     * Mirrors templateEngine.js (cloud) so Local Agent gets the same live stream experience.
     * runId format: {testRunId}-{executionId}
     */
    private String generateSimpleScript(TestCase tc, String runId) {
        StringBuilder sb = new StringBuilder();
        sb.append("const { test, expect } = require('@playwright/test');\n");
        sb.append("const WebSocket = require('ws');\n\n");
        sb.append("test(\"").append(escapeJs(tc.getTitle())).append("\", async ({ page }) => {\n");

        String baseUrl = tc.getBaseUrl() != null ? tc.getBaseUrl() : "http://localhost";

        // CDP Screencast setup — same as templateEngine.js
        sb.append("  const wsUrl = process.env.WS_URL || \"ws://localhost:4001\";\n");
        sb.append("  const ws = new WebSocket(`${wsUrl}/?runId=").append(runId).append("&role=provider`);\n");
        sb.append("  await new Promise((resolve) => {\n");
        sb.append("    if (ws.readyState === WebSocket.OPEN) return resolve();\n");
        sb.append("    ws.on('open', resolve);\n");
        sb.append("    ws.on('error', (e) => { console.warn('[WS] Screencast connection failed:', e.message); resolve(); });\n");
        sb.append("    setTimeout(resolve, 3000);\n");
        sb.append("  });\n");
        sb.append("  const client = await page.context().newCDPSession(page);\n");
        sb.append("  await client.send('Page.startScreencast', { format: 'jpeg', quality: 50, everyNthFrame: 1 });\n");
        sb.append("  client.on('Page.screencastFrame', async (frameObject) => {\n");
        sb.append("    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'frame', data: frameObject.data }));\n");
        sb.append("    try { await client.send('Page.screencastFrameAck', { sessionId: frameObject.sessionId }); } catch(e){}\n");
        sb.append("  });\n");
        sb.append("  await page.waitForTimeout(300);\n\n");
        sb.append("  async function highlight(selector, text) {\n");
        sb.append("    try {\n");
        sb.append("      await page.evaluate(({sel, txt}) => {\n");
        sb.append("        const el = document.querySelector(sel);\n");
        sb.append("        if (el) {\n");
        sb.append("          document.querySelectorAll('.playwright-highlight').forEach(e => e.remove());\n");
        sb.append("          const rect = el.getBoundingClientRect();\n");
        sb.append("          const box = document.createElement('div');\n");
        sb.append("          box.className = 'playwright-highlight';\n");
        sb.append("          box.style.position = 'absolute';\n");
        sb.append("          box.style.border = '3px solid red';\n");
        sb.append("          box.style.boxShadow = '0 0 15px red';\n");
        sb.append("          box.style.top = (rect.top + window.scrollY - 4) + 'px';\n");
        sb.append("          box.style.left = (rect.left + window.scrollX - 4) + 'px';\n");
        sb.append("          box.style.width = (rect.width + 8) + 'px';\n");
        sb.append("          box.style.height = (rect.height + 8) + 'px';\n");
        sb.append("          box.style.zIndex = '999999';\n");
        sb.append("          box.style.pointerEvents = 'none';\n");
        sb.append("          const tooltip = document.createElement('div');\n");
        sb.append("          tooltip.style.position = 'absolute';\n");
        sb.append("          tooltip.style.background = 'red';\n");
        sb.append("          tooltip.style.color = 'white';\n");
        sb.append("          tooltip.style.padding = '4px 8px';\n");
        sb.append("          tooltip.style.fontSize = '12px';\n");
        sb.append("          tooltip.style.top = '-25px';\n");
        sb.append("          tooltip.style.left = '0';\n");
        sb.append("          tooltip.style.borderRadius = '4px';\n");
        sb.append("          tooltip.style.fontWeight = 'bold';\n");
        sb.append("          tooltip.innerText = txt;\n");
        sb.append("          box.appendChild(tooltip);\n");
        sb.append("          document.body.appendChild(box);\n");
        sb.append("        }\n");
        sb.append("      }, { sel: selector, txt: text });\n");
        sb.append("      await page.waitForTimeout(400);\n");
        sb.append("    } catch(e) {}\n");
        sb.append("  }\n\n");


        // Parse steps_structured
        List<Map<String, Object>> steps = new ArrayList<>();
        if (tc.getStepsStructured() != null) {
            try {
                steps = objectMapper.readValue(tc.getStepsStructured(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            } catch (Exception e) {
                log.warn("Failed to parse steps_structured for testCase {}", tc.getId());
            }
        }

        steps.sort((a, b) -> {
            int oa = a.get("order") != null ? ((Number) a.get("order")).intValue() : 0;
            int ob = b.get("order") != null ? ((Number) b.get("order")).intValue() : 0;
            return oa - ob;
        });

        for (int i = 0; i < steps.size(); i++) {
            Map<String, Object> step = steps.get(i);
            String action = (String) step.getOrDefault("action", "");
            String selector = escapeJs((String) step.getOrDefault("selector", ""));
            String value = escapeJs((String) step.getOrDefault("value", ""));
            String expected = escapeJs((String) step.getOrDefault("expected", ""));
            String stepPath = escapeJs((String) step.getOrDefault("path", ""));
            String description = escapeJs((String) step.getOrDefault("description", action));
            int stepNum = i + 1;

            sb.append("  // Step ").append(stepNum).append("\n");
            sb.append("  await test.step(\"").append(description).append("\", async () => {\n");
            sb.append("    if (ws.readyState === WebSocket.OPEN) { try { ws.send(JSON.stringify({ type: 'step_started', stepIndex: ").append(i).append(" })); } catch(e){} }\n");

            switch (action) {
                case "goto":
                    sb.append("    await page.goto(\"").append(baseUrl).append(stepPath).append("\", { timeout: 15000 });\n");
                    sb.append("    await page.waitForTimeout(800);\n");
                    break;
                case "fill":
                    sb.append("    await highlight(\"").append(selector).append("\", \"Gõ: ").append(value).append("\");\n");
                    sb.append("    await page.fill(\"").append(selector).append("\", \"\", { timeout: 5000 });\n");
                    sb.append("    await page.locator(\"").append(selector).append("\").pressSequentially(\"").append(value).append("\", { delay: 50, timeout: 5000 });\n");
                    sb.append("    await page.waitForTimeout(200);\n");
                    break;
                case "click":
                    sb.append("    await highlight(\"").append(selector).append("\", \"Click\");\n");
                    sb.append("    await page.click(\"").append(selector).append("\", { timeout: 5000 });\n");
                    sb.append("    await page.waitForTimeout(500);\n");
                    break;
                case "select":
                    sb.append("    await highlight(\"").append(selector).append("\", \"Chọn: ").append(value).append("\");\n");
                    sb.append("    await page.selectOption(\"").append(selector).append("\", \"").append(value).append("\", { timeout: 5000 });\n");
                    sb.append("    await page.waitForTimeout(500);\n");
                    break;
                case "wait_for":
                    sb.append("    await page.waitForSelector(\"").append(selector).append("\", { timeout: 5000 });\n");
                    break;
                case "expect_url":
                    sb.append("    await expect(page, \"Lỗi URL: Trang hiện tại không khớp.\").toHaveURL(\"").append(baseUrl).append(expected).append("\", { timeout: 5000 });\n");
                    break;
                case "expect_text":
                    sb.append("    await highlight(\"").append(selector).append("\", \"Check Text: ").append(expected).append("\");\n");
                    sb.append("    await expect(page.locator(\"").append(selector).append("\"), \"Lỗi Text: Không tìm thấy nội dung.\").toContainText(\"").append(expected).append("\", { timeout: 5000 });\n");
                    break;
                case "expect_visible":
                    sb.append("    await highlight(\"").append(selector).append("\", \"Check Visible\");\n");
                    sb.append("    await expect(page.locator(\"").append(selector).append("\"), \"Lỗi Hiển thị: Không thấy element.\").toBeVisible({ timeout: 5000 });\n");
                    break;
                case "expect_hidden":
                    sb.append("    await expect(page.locator(\"").append(selector).append("\")).toBeHidden({ timeout: 5000 });\n");
                    break;
                default:
                    sb.append("    // Unknown action: ").append(action).append("\n");
            }

            sb.append("    await page.screenshot({ path: 'step-").append(stepNum).append("-after.png' });\n");
            sb.append("  });\n\n");
        }

        sb.append("  try { ws.close(); } catch(e){}\n");
        sb.append("});\n");
        return sb.toString();
    }

    private String escapeJs(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}

