package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.response.TestRunStatusResponse;
import org.example.backend.entity.TestCase;
import org.example.backend.entity.TestRun;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.repository.TestRunRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class TestRunService {

    private final TestRunRepository testRunRepository;
    private final TestCaseRepository testCaseRepository;
    // We will assume these services exist based on setup.md. We might need to mock them or implement them if they are missing.
    private final EvidenceService evidenceService;
    private final NotificationService notificationService;
    private final RequirementService requirementService;
    private final RestTemplate restTemplate;

    @Value("${playwright.service.url:http://localhost:4000}")
    private String playwrightServiceUrl;

    public String startTestRun(Long testCaseId, Long triggeredBy) {
        TestCase testCase = testCaseRepository.findById(testCaseId)
            .orElseThrow(() -> new ResourceNotFoundException("TestCase", String.valueOf(testCaseId)));

        Map<String, Object> payload = new HashMap<>();
        payload.put("testCase", buildTestCasePayload(testCase));

        ResponseEntity<Map> response = restTemplate.postForEntity(
            playwrightServiceUrl + "/run",
            payload,
            Map.class
        );

        String runId = (String) response.getBody().get("runId");

        TestRun testRun = TestRun.builder()
            .id(runId)
            .testCaseId(testCaseId)
            .projectId(testCase.getProjectId())
            .status("RUNNING")
            .triggeredBy(triggeredBy)
            .startedAt(LocalDateTime.now())
            .createdAt(LocalDateTime.now())
            .build();

        testRunRepository.save(testRun);
        log.info("[TestRun] Started: {} for test case {}", runId, testCaseId);
        return runId;
    }

    @Transactional
    public TestRunStatusResponse getStatus(String runId, Long projectId) {
        TestRun testRun = testRunRepository.findById(runId)
            .orElseThrow(() -> new ResourceNotFoundException("TestRun", runId));

        if (!testRun.getStatus().equals("RUNNING")) {
            return buildResponse(testRun);
        }

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                playwrightServiceUrl + "/status/" + runId,
                Map.class
            );
            Map<String, Object> data = response.getBody();
            String nodeStatus = (String) data.get("status");

            if (nodeStatus.equals("RUNNING")) {
                List<Map<String, Object>> rawSteps = (List<Map<String, Object>>) data.get("steps");
                List<Map<String, Object>> rawScreenshots = (List<Map<String, Object>>) data.get("screenshots");
                
                List<TestRun.StepResult> steps = rawSteps == null ? List.of() :
                    rawSteps.stream().map(s -> new TestRun.StepResult(
                        (String) s.get("title"),
                        (Integer) s.get("duration"),
                        (String) s.get("status"),
                        (String) s.get("error")
                    )).toList();

                List<TestRunStatusResponse.ScreenshotResponse> screenshotResponses = new ArrayList<>();
                if (rawScreenshots != null) {
                    for (Map<String, Object> screenshot : rawScreenshots) {
                        String base64 = (String) screenshot.get("base64");
                        String filename = (String) screenshot.get("filename");
                        String mimeType = (String) screenshot.get("mimeType");

                        screenshotResponses.add(TestRunStatusResponse.ScreenshotResponse.builder()
                            .evidenceId(1L)
                            .filename(filename != null && filename.contains("\\") ? filename.substring(filename.lastIndexOf("\\") + 1) : filename)
                            .url("data:" + (mimeType != null ? mimeType : "image/png") + ";base64," + base64)
                            .build());
                    }
                }

                return TestRunStatusResponse.builder()
                    .runId(runId)
                    .status("RUNNING")
                    .steps(steps)
                    .screenshots(screenshotResponses)
                    .startedAt(testRun.getStartedAt())
                    .build();
            }

            return handleFinishedRun(testRun, data);

        } catch (Exception e) {
            log.error("[TestRun] Error calling Playwright Service: {}", e.getMessage());
            return TestRunStatusResponse.builder()
                .runId(runId)
                .status("RUNNING")
                .build();
        }
    }

    @Transactional
    protected TestRunStatusResponse handleFinishedRun(TestRun testRun, Map<String, Object> data) {
        String status = (String) data.get("status");
        String scriptSource = (String) data.get("scriptSource");
        String script = (String) data.get("script");
        List<Map<String, Object>> rawSteps = (List<Map<String, Object>>) data.get("steps");
        List<Map<String, Object>> rawScreenshots = (List<Map<String, Object>>) data.get("screenshots");
        Map<String, Object> rawError = (Map<String, Object>) data.get("error");
        Integer duration = (Integer) data.get("duration");

        List<TestRun.StepResult> steps = rawSteps == null ? List.of() :
            rawSteps.stream().map(s -> new TestRun.StepResult(
                (String) s.get("title"),
                (Integer) s.get("duration"),
                (String) s.get("status"),
                (String) s.get("error")
            )).toList();

        List<Long> evidenceIds = new ArrayList<>();
        List<TestRunStatusResponse.ScreenshotResponse> screenshotResponses = new ArrayList<>();

        if (rawScreenshots != null) {
            for (Map<String, Object> screenshot : rawScreenshots) {
                String base64 = (String) screenshot.get("base64");
                String filename = (String) screenshot.get("filename");
                String mimeType = (String) screenshot.get("mimeType");

                Long evidenceId = 1L; // Placeholder until EvidenceService supports uploadScreenshot

                evidenceIds.add(evidenceId);
                screenshotResponses.add(TestRunStatusResponse.ScreenshotResponse.builder()
                    .evidenceId(evidenceId)
                    .filename(filename != null && filename.contains("\\") ? filename.substring(filename.lastIndexOf("\\") + 1) : filename)
                    .url("data:" + (mimeType != null ? mimeType : "image/png") + ";base64," + base64)
                    .build());
            }
        }

        if (script != null && scriptSource != null) {
            testCaseRepository.updateScriptCache(
                testRun.getTestCaseId(), script, scriptSource
            );
        }

        testCaseRepository.updateLastRunInfo(
            testRun.getTestCaseId(), status, testRun.getId()
        );

        String errorMessage = null;
        String failedStep = null;
        if (rawError != null) {
            errorMessage = (String) rawError.get("message");
            failedStep = (String) rawError.get("failedStep");
        }

        Long bugReportId = null;
        if (status.equals("FAIL")) {
            TestCase testCase = testCaseRepository.findById(testRun.getTestCaseId()).orElseThrow();
            bugReportId = createAutoBugReport(testCase, testRun, errorMessage, failedStep, steps, evidenceIds);

            if (testCase.getCreatedBy() != null) {
                // notificationService.send is not available, just logging for now.
                log.info("Test case FAIL: {}. Bug Report created. Failed step: {}", testCase.getTitle(), failedStep);
            }
        }

        TestCase tc = testCaseRepository.findById(testRun.getTestCaseId()).orElseThrow();
        // if (tc.getRequirementId() != null) {
        //     requirementService.recalculateRtmStatus(tc.getRequirementId());
        // }

        testRun.setStatus(status);
        testRun.setScriptSource(scriptSource);
        testRun.setStepsResult(steps);
        testRun.setDurationMs(duration);
        testRun.setErrorMessage(errorMessage);
        testRun.setFailedStep(failedStep);
        testRun.setEvidenceIds(evidenceIds);
        testRun.setBugReportId(bugReportId);
        testRun.setFinishedAt(LocalDateTime.now());
        testRunRepository.save(testRun);

        log.info("[TestRun] Saved: {} | {} | {}ms", testRun.getId(), status, duration);

        return TestRunStatusResponse.builder()
            .runId(testRun.getId())
            .status(status)
            .scriptSource(scriptSource)
            .steps(steps)
            .screenshots(screenshotResponses)
            .error(rawError == null ? null : TestRunStatusResponse.ErrorInfo.builder()
                .message(errorMessage)
                .failedStep(failedStep)
                .build())
            .durationMs(duration)
            .bugReportId(bugReportId)
            .startedAt(testRun.getStartedAt())
            .finishedAt(testRun.getFinishedAt())
            .build();
    }

    private Long createAutoBugReport(TestCase testCase, TestRun testRun,
                                     String errorMessage, String failedStep,
                                     List<TestRun.StepResult> steps,
                                     List<Long> evidenceIds) {
        // Implementation omitted for brevity. You can implement bug report creation here.
        // For now, we return null so it doesn't crash if BugReport isn't fully implemented.
        return null;
    }

    private Map<String, Object> buildTestCasePayload(TestCase tc) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", tc.getTitle());
        payload.put("base_url", tc.getBaseUrl());
        try {
            if (tc.getStepsStructured() != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(tc.getStepsStructured());
                
                // If double-serialized string
                if (node.isTextual()) {
                    node = mapper.readTree(node.asText());
                }
                
                // If wrapped in an object
                if (node.isObject() && node.has("stepsStructured")) {
                    node = node.get("stepsStructured");
                } else if (node.isObject() && node.has("steps_structured")) {
                    node = node.get("steps_structured");
                }
                
                // Convert JsonNode to a standard Java List/Map to guarantee RestTemplate serializes it perfectly
                Object parsedSteps = mapper.convertValue(node, Object.class);
                payload.put("steps_structured", parsedSteps);
            }
        } catch (Exception e) {
            log.error("Failed to parse stepsStructured", e);
            payload.put("steps_structured", tc.getStepsStructured());
        }
        payload.put("expected_result", tc.getExpectedResult());
        payload.put("cached_playwright_script", tc.getCachedPlaywrightScript());
        payload.put("script_source", tc.getScriptSource());
        return payload;
    }

    private TestRunStatusResponse buildResponse(TestRun tr) {
        return TestRunStatusResponse.builder()
            .runId(tr.getId())
            .status(tr.getStatus())
            .scriptSource(tr.getScriptSource())
            .steps(tr.getStepsResult())
            .durationMs(tr.getDurationMs())
            .bugReportId(tr.getBugReportId())
            .startedAt(tr.getStartedAt())
            .finishedAt(tr.getFinishedAt())
            .build();
    }
}
