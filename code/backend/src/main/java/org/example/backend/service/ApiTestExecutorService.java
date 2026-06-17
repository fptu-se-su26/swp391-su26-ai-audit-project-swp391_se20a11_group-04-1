package org.example.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.AgentTaskCreateDTO;
import org.example.backend.dto.apitest.ApiTestResultResponse;
import org.example.backend.dto.apitest.AssertionDto;
import org.example.backend.dto.apitest.AssertionResultDto;
import org.example.backend.entity.AgentTask;
import org.example.backend.entity.ApiEnvironment;
import org.example.backend.entity.TestCase;
import org.example.backend.entity.ApiTestResult;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.enums.ApiTestStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AgentTaskRepository;
import org.example.backend.repository.ApiEnvironmentRepository;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.repository.ApiTestResultRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.event.ApiTestJobCompletedEvent;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class ApiTestExecutorService {

    private final VariableResolverService variableResolver;
    private final AssertionEvaluatorService assertionEvaluator;
    private final TestCaseRepository testCaseRepository;
    private final ApiEnvironmentRepository apiEnvironmentRepository;
    private final ApiTestResultRepository resultRepository;
    private final UserAccountRepository userAccountRepository;
    private final AgentTaskService agentTaskService;
    private final AgentTaskRepository agentTaskRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public ApiTestExecutorService(
            VariableResolverService variableResolver,
            AssertionEvaluatorService assertionEvaluator,
            TestCaseRepository testCaseRepository,
            ApiEnvironmentRepository apiEnvironmentRepository,
            ApiTestResultRepository resultRepository,
            UserAccountRepository userAccountRepository,
            AgentTaskService agentTaskService,
            AgentTaskRepository agentTaskRepository,
            ObjectMapper objectMapper,
            @Qualifier("apiTestRestTemplate") RestTemplate restTemplate) {
        this.variableResolver = variableResolver;
        this.assertionEvaluator = assertionEvaluator;
        this.testCaseRepository = testCaseRepository;
        this.apiEnvironmentRepository = apiEnvironmentRepository;
        this.resultRepository = resultRepository;
        this.userAccountRepository = userAccountRepository;
        this.agentTaskService = agentTaskService;
        this.agentTaskRepository = agentTaskRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    @Async("apiTestExecutor")
    public CompletableFuture<ApiTestResultResponse> execute(Long testCaseId, Long environmentId, Long userId) {
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResourceNotFoundException("TestCase not found"));

        ApiEnvironment environment = null;
        String variablesJson = "{}";
        if (environmentId != null) {
            environment = apiEnvironmentRepository.findById(environmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("ApiEnvironment not found"));
            variablesJson = environment.getVariables();
        }

        UserAccount user = userAccountRepository.findById(userId).orElse(null);

        String url = variableResolver.resolveVariables(testCase.getApiUrl() == null ? "" : testCase.getApiUrl(), variablesJson);
        
        // Resolve and append query params
        try {
            if (testCase.getApiQueryParams() != null && !testCase.getApiQueryParams().isBlank()) {
                Map<String, String> rawParams = objectMapper.readValue(testCase.getApiQueryParams(), new TypeReference<>() {});
                StringBuilder urlBuilder = new StringBuilder(url);
                boolean first = !url.contains("?");
                for (Map.Entry<String, String> entry : rawParams.entrySet()) {
                    if (entry.getKey() != null && !entry.getKey().isBlank()) {
                        String resolvedValue = variableResolver.resolveVariables(entry.getValue() == null ? "" : entry.getValue(), variablesJson);
                        urlBuilder.append(first ? "?" : "&")
                                  .append(java.net.URLEncoder.encode(entry.getKey(), java.nio.charset.StandardCharsets.UTF_8))
                                  .append("=")
                                  .append(java.net.URLEncoder.encode(resolvedValue, java.nio.charset.StandardCharsets.UTF_8));
                        first = false;
                    }
                }
                url = urlBuilder.toString();
            }
        } catch (Exception e) {
            log.error("Failed to parse or append query params", e);
        }

        String method = testCase.getApiMethod() == null ? "GET" : testCase.getApiMethod();
        String body = variableResolver.resolveVariables(testCase.getApiBody() == null ? "" : testCase.getApiBody(), variablesJson);
        
        // Cố gắng parse headers
        Map<String, String> resolvedHeaders = new HashMap<>();
        try {
            if (testCase.getApiHeaders() != null && !testCase.getApiHeaders().isBlank()) {
                Map<String, String> rawHeaders = objectMapper.readValue(testCase.getApiHeaders(), new TypeReference<>() {});
                for (Map.Entry<String, String> entry : rawHeaders.entrySet()) {
                    resolvedHeaders.put(entry.getKey(), variableResolver.resolveVariables(entry.getValue(), variablesJson));
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse headers", e);
        }

        boolean isLocalHost = url.contains("localhost") || url.contains("127.0.0.1") || url.contains("host.docker.internal");

        if (isLocalHost) {
            return executeViaLocalAgent(testCase, environment, user, url, method, resolvedHeaders, body);
        } else {
            return executeDirectly(testCase, environment, user, url, method, resolvedHeaders, body);
        }
    }

    private CompletableFuture<ApiTestResultResponse> executeViaLocalAgent(
            TestCase testCase, ApiEnvironment environment, UserAccount user,
            String url, String method, Map<String, String> headers, String body) {
        
        try {
            Map<String, Object> scriptPayload = new HashMap<>();
            scriptPayload.put("method", method);
            scriptPayload.put("url", url);
            scriptPayload.put("headers", headers);
            if (body != null && !body.isBlank()) {
                scriptPayload.put("body", body);
            }

            AgentTaskCreateDTO createDTO = new AgentTaskCreateDTO();
            createDTO.setProjectId(testCase.getProjectId());
            createDTO.setTestRunId(null);
            createDTO.setExecutionId(null);
            createDTO.setScript(objectMapper.writeValueAsString(scriptPayload));
            createDTO.setTaskType("API_TEST_JOB");
            createDTO.setBaseUrl(url);

            UUID taskId = agentTaskService.createAgentTask(createDTO);
            AgentTask task = agentTaskRepository.findById(taskId).orElse(null);

            ApiTestResult result = ApiTestResult.builder()
                    .testCase(testCase)
                    .environment(environment)
                    .executedBy(user)
                    .status(ApiTestStatus.PENDING)
                    .executedVia("LOCAL_AGENT")
                    .agentTask(task)
                    .build();

            result = resultRepository.save(result);
            return CompletableFuture.completedFuture(mapToResponse(result));
        } catch (Exception e) {
            log.error("Failed to schedule local agent test", e);
            ApiTestResult result = ApiTestResult.builder()
                    .testCase(testCase)
                    .environment(environment)
                    .executedBy(user)
                    .status(ApiTestStatus.ERROR)
                    .errorMessage("Failed to schedule local agent task: " + e.getMessage())
                    .executedVia("LOCAL_AGENT")
                    .build();
            result = resultRepository.save(result);
            return CompletableFuture.completedFuture(mapToResponse(result));
        }
    }

    private CompletableFuture<ApiTestResultResponse> executeDirectly(
            TestCase testCase, ApiEnvironment environment, UserAccount user,
            String url, String method, Map<String, String> headers, String body) {

        long startTime = System.currentTimeMillis();
        ApiTestResult result = ApiTestResult.builder()
                .testCase(testCase)
                .environment(environment)
                .executedBy(user)
                .executedVia("DIRECT")
                .build();

        try {
            HttpHeaders httpHeaders = new HttpHeaders();
            headers.forEach(httpHeaders::add);

            HttpEntity<String> entity = new HttpEntity<>(body, httpHeaders);

            ResponseEntity<String> response = restTemplate.exchange(
                    new URI(url), HttpMethod.valueOf(method.toUpperCase()), entity, String.class);

            long endTime = System.currentTimeMillis();
            
            result.setStatusCode(response.getStatusCode().value());
            result.setResponseTimeMs((int) (endTime - startTime));
            result.setResponseBody(response.getBody());
            result.setResponseHeaders(objectMapper.writeValueAsString(response.getHeaders().toSingleValueMap()));
            
            evaluateAndSave(result, testCase.getApiAssertions());

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            long endTime = System.currentTimeMillis();
            result.setStatusCode(e.getStatusCode().value());
            result.setResponseTimeMs((int) (endTime - startTime));
            result.setResponseBody(e.getResponseBodyAsString());
            try {
                if (e.getResponseHeaders() != null) {
                    result.setResponseHeaders(objectMapper.writeValueAsString(e.getResponseHeaders().toSingleValueMap()));
                }
            } catch (Exception ignored) {}
            
            evaluateAndSave(result, testCase.getApiAssertions());
        } catch (RestClientException | IllegalArgumentException | java.net.URISyntaxException e) {
            result.setStatus(ApiTestStatus.ERROR);
            result.setErrorMessage(e.getMessage());
            result = resultRepository.save(result);
        } catch (Exception e) {
            result.setStatus(ApiTestStatus.ERROR);
            result.setErrorMessage("Internal error: " + e.getMessage());
            result = resultRepository.save(result);
        }

        return CompletableFuture.completedFuture(mapToResponse(result));
    }

    @EventListener
    @Transactional
    public void onAgentResult(ApiTestJobCompletedEvent event) {
        log.info("Received Agent Result for API Task ID: {}", event.getTaskId());

        ApiTestResult result = resultRepository.findByAgentTaskId(event.getTaskId())
                .orElse(null);

        if (result == null) {
            log.warn("Cannot process agent result. Result not found. TaskId: {}", event.getTaskId());
            return;
        }
        
        if (result.getStatus() != ApiTestStatus.PENDING) {
            log.info("Agent result received but status is already {}. Proceeding to overwrite. TaskId: {}", result.getStatus(), event.getTaskId());
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(event.getPayload(), new TypeReference<>() {});
            
            if (payload.containsKey("error")) {
                result.setStatus(ApiTestStatus.ERROR);
                result.setErrorMessage(String.valueOf(payload.get("error")));
            } else {
                Object statusObj = payload.get("status");
                if (statusObj instanceof Number) {
                    result.setStatusCode(((Number) statusObj).intValue());
                } else if (statusObj instanceof String) {
                    try { result.setStatusCode(Integer.parseInt((String) statusObj)); } catch (NumberFormatException ignored) {}
                }

                Object timeObj = payload.get("timeMs");
                if (timeObj instanceof Number) {
                    result.setResponseTimeMs(((Number) timeObj).intValue());
                } else if (timeObj instanceof String) {
                    try { result.setResponseTimeMs(Integer.parseInt((String) timeObj)); } catch (NumberFormatException ignored) {}
                }

                if (payload.get("body") != null) {
                    result.setResponseBody(String.valueOf(payload.get("body")));
                }
                if (payload.get("headers") != null) {
                    result.setResponseHeaders(objectMapper.writeValueAsString(payload.get("headers")));
                }
                
                evaluateAndSave(result, result.getTestCase().getApiAssertions());
                return; // evaluateAndSave will do the save
            }
        } catch (Exception e) {
            log.error("Failed to process agent result payload", e);
            result.setStatus(ApiTestStatus.ERROR);
            result.setErrorMessage("Failed to process agent payload: " + e.getMessage());
        }

        resultRepository.save(result);
    }

    private void evaluateAndSave(ApiTestResult result, String assertionsJson) {
        if (assertionsJson == null || assertionsJson.isBlank()) {
            assertionsJson = "[]";
        }
        try {
            List<AssertionDto> assertions = objectMapper.readValue(assertionsJson, new TypeReference<>() {});
            
            Map<String, String> responseHeaders = new HashMap<>();
            if (result.getResponseHeaders() != null) {
                responseHeaders = objectMapper.readValue(result.getResponseHeaders(), new TypeReference<>() {});
            }

            List<AssertionResultDto> assertionResults = assertionEvaluator.evaluate(
                    assertions,
                    result.getStatusCode(),
                    result.getResponseTimeMs() != null ? result.getResponseTimeMs() : 0,
                    responseHeaders,
                    result.getResponseBody()
            );

            result.setAssertionResults(objectMapper.writeValueAsString(assertionResults));

            boolean allPassed = true;
            for (AssertionResultDto r : assertionResults) {
                if (!r.isPassed()) {
                    allPassed = false;
                    break;
                }
            }

            result.setStatus(allPassed ? ApiTestStatus.PASSED : ApiTestStatus.FAILED);
            resultRepository.save(result);
        } catch (Exception e) {
            log.error("Failed to evaluate assertions", e);
            result.setStatus(ApiTestStatus.ERROR);
            result.setErrorMessage("Assertion evaluation error: " + e.getMessage());
            resultRepository.save(result);
        }
    }

    public ApiTestResultResponse mapToResponse(ApiTestResult entity) {
        ApiTestResultResponse dto = new ApiTestResultResponse();
        dto.setId(entity.getId());
        dto.setTestCaseId(entity.getTestCase().getId());
        if (entity.getEnvironment() != null) {
            dto.setEnvironmentId(entity.getEnvironment().getId());
        }
        if (entity.getExecutedBy() != null) {
            dto.setExecutedBy(entity.getExecutedBy().getId());
        }
        dto.setStatus(entity.getStatus());
        dto.setStatusCode(entity.getStatusCode());
        dto.setResponseTimeMs(entity.getResponseTimeMs());
        try {
            if (entity.getResponseHeaders() != null) {
                dto.setResponseHeaders(objectMapper.readValue(entity.getResponseHeaders(), new TypeReference<>() {}));
            }
            if (entity.getAssertionResults() != null) {
                dto.setAssertionResults(objectMapper.readValue(entity.getAssertionResults(), new TypeReference<>() {}));
            }
        } catch (Exception ignored) {}
        dto.setResponseBody(entity.getResponseBody());
        dto.setErrorMessage(entity.getErrorMessage());
        dto.setExecutedVia(entity.getExecutedVia());
        dto.setExecutedAt(entity.getExecutedAt());
        dto.setSaved(entity.isSaved());
        return dto;
    }
}
