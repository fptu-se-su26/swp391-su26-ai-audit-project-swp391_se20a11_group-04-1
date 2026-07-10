package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.NotificationWebSocketHandler;
import org.example.backend.dto.testing.*;
import org.example.backend.dto.testing.internal.*;
import org.example.backend.dto.testing.ws.TestRunProgressEvent;
import org.example.backend.entity.OutboxEvent;
import org.example.backend.entity.TestExecution;
import org.example.backend.entity.TestRun;
import org.example.backend.entity.enums.TestExecutionStatus;
import org.example.backend.entity.enums.TestRunStatus;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ConflictException;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.mapper.TestRunMapper;
import org.example.backend.repository.OutboxEventRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.repository.TestExecutionRepository;
import org.example.backend.repository.TestRunRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.AITestAnalysisService;
import org.example.backend.service.TestRunService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TestRunServiceImpl implements TestRunService {

    private final TestRunRepository testRunRepository;
    private final TestExecutionRepository testExecutionRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserAccountRepository userAccountRepository;
    private final TestCaseRepository testCaseRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;
    private final TestRunMapper testRunMapper;
    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final AITestAnalysisService aiTestAnalysisService;

    @Override
    @Transactional
    public TestRunResponse createTestRun(CreateTestRunRequest request, Long userId) {
        String correlationId = UUID.randomUUID().toString();

        TestRun testRun = new TestRun();
        testRun.setStatus(TestRunStatus.PENDING);
        testRun.setProject(projectRepository.getReferenceById(request.projectId()));
        testRun.setCreatedBy(userAccountRepository.getReferenceById(userId));
        testRun.setCorrelationId(correlationId);
        testRun.setName(request.name() != null ? request.name()
                : "Run " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM HH:mm")));
        testRun.setTotalTestCases(request.testCaseIds().size());
        testRun = testRunRepository.save(testRun);

        int orderIndex = 0;
        for (Long testCaseId : request.testCaseIds()) {
            TestExecution exec = new TestExecution();
            exec.setTestRun(testRun);
            exec.setTestCase(testCaseRepository.getReferenceById(testCaseId));
            exec.setStatus(TestExecutionStatus.PENDING);
            exec.setOrderIndex(orderIndex++);
            exec.setExecutedBy(userAccountRepository.getReferenceById(userId));
            exec.setEnvironment(org.example.backend.entity.enums.Environment.DEV);
            exec.setExecutedAt(java.time.LocalDateTime.now());
            exec = testExecutionRepository.save(exec);

            exec.setIdempotencyKey(testRun.getId() + "-" + exec.getId());
            testExecutionRepository.save(exec);
        }

        TestRunJobCommand command = TestRunJobCommand.builder()
                .testRunId(testRun.getId())
                .projectId(request.projectId())
                .triggeredByUserId(userId)
                .correlationId(correlationId)
                .timestamp(Instant.now())
                .build();

        try {
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .eventType("TEST_RUN_JOB")
                    .aggregateType("TestRun")
                    .aggregateId(testRun.getId())
                    .idempotencyKey(java.util.UUID.randomUUID().toString())
                    .payload(objectMapper.writeValueAsString(command))
                    .build();
            outboxEventRepository.save(outboxEvent);
        } catch (Exception e) {
            log.error("[{}] Failed to save outbox event for TestRun {}", correlationId, testRun.getId(), e);
            throw new RuntimeException("Failed to initiate test run", e);
        }

        log.info("[{}] TestRun {} created with {} test cases",
                correlationId, testRun.getId(), request.testCaseIds().size());

        // Push WS ngay sau khi lưu DB thành công — FE mở màn hình livestream ngay,
        // không cần chờ Outbox → Kafka → Worker round-trip (giảm ~3-5 giây delay)
        try {
            notificationWebSocketHandler.sendToUser(
                    userId,
                    objectMapper.writeValueAsString(TestRunProgressEvent.builder()
                            .type("TEST_RUN_QUEUED")
                            .testRunId(testRun.getId())
                            .finalStatus(TestRunStatus.PENDING.name())
                            .totalCount(request.testCaseIds().size())
                            .completedCount(0)
                            .passedCount(0)
                            .failedCount(0)
                            .skippedCount(0)
                            .abortedCount(0)
                            .correlationId(correlationId)
                            .build()));
        } catch (Exception e) {
            // Non-critical — WS push thất bại không ảnh hưởng luồng chính
            log.warn("[{}] Failed to send TEST_RUN_QUEUED WebSocket event for TestRun {}",
                    correlationId, testRun.getId(), e);
        }

        return testRunMapper.toResponse(testRun);
    }

    @Override
    @Transactional(readOnly = true)
    public TestRunExecutionPlan getExecutionPlan(Long testRunId) {
        TestRun testRun = testRunRepository.findById(testRunId)
                .orElseThrow(() -> new ResourceNotFoundException("TestRun not found"));

        List<TestExecution> executions = testExecutionRepository.findByTestRunIdWithTestCaseAndSteps(testRunId);

        return testRunMapper.toExecutionPlan(testRun, executions);
    }

    @Override
    @Transactional
    public void updateTestRunStatus(Long testRunId, UpdateTestRunStatusRequest request) {
        TestRun testRun = testRunRepository.findById(testRunId)
                .orElseThrow(() -> new ResourceNotFoundException("TestRun not found"));

        if (testRun.getStatus().isTerminal()) {
            log.info("[{}] TestRun {} already terminal ({}), ignoring status update to {}",
                    testRun.getCorrelationId(), testRunId, testRun.getStatus(), request.status());
            return;
        }

        TestRunStatus newStatus = TestRunStatus.valueOf(request.status());

        if (newStatus == TestRunStatus.RUNNING && testRun.getStatus() != TestRunStatus.PENDING) {
            throw new ConflictException("TestRun already started by another worker");
        }

        testRun.setStatus(newStatus);

        if (newStatus == TestRunStatus.RUNNING) {
            testRun.setStartedAt(LocalDateTime.now());
        } else if (newStatus.isTerminal()) {
            testRun.setCompletedAt(LocalDateTime.now());
        }

        if (request.notes() != null && !request.notes().isEmpty()) {
            testRun.setErrorMessage(request.notes());
            log.warn("[{}] TestRun {} recorded error: {}", testRun.getCorrelationId(), testRunId, request.notes());
        }

        testRunRepository.save(testRun);

        log.info("[{}] TestRun {} status → {}",
                testRun.getCorrelationId(), testRunId, newStatus);

        Map<TestExecutionStatus, Long> counts = getStatusCountMap(testRunId);

        try {
            notificationWebSocketHandler.sendToUser(
                    testRun.getCreatedBy().getId(),
                    objectMapper.writeValueAsString(TestRunProgressEvent.builder()
                            .type(newStatus == TestRunStatus.RUNNING ? "TEST_RUN_STARTED" : "TEST_RUN_COMPLETED")
                            .testRunId(testRun.getId())
                            .finalStatus(newStatus.name())
                            .totalCount(testRun.getTotalTestCases())
                            .completedCount(testRun.getCompletedCount())
                            .passedCount(counts.getOrDefault(TestExecutionStatus.PASSED, 0L).intValue())
                            .failedCount(counts.getOrDefault(TestExecutionStatus.FAILED, 0L).intValue())
                            .skippedCount(counts.getOrDefault(TestExecutionStatus.SKIPPED, 0L).intValue())
                            .abortedCount(counts.getOrDefault(TestExecutionStatus.ABORTED, 0L).intValue())
                            .correlationId(testRun.getCorrelationId())
                            .build()));
        } catch (Exception e) {
            log.error("[{}] Failed to send WebSocket event for TestRun {}", testRun.getCorrelationId(), testRunId, e);
        }
    }

    @Override
    @Transactional
    public void startExecution(Long testRunId, StartExecutionRequest request) {
        TestRun testRun = testRunRepository.findById(testRunId)
                .orElseThrow(() -> new ResourceNotFoundException("TestRun not found"));

        if (testRun.getStatus().isTerminal()) {
            throw new ConflictException("TestRun " + testRunId + " is no longer active: " + testRun.getStatus());
        }

        TestExecution exec = testExecutionRepository.findById(request.testExecutionId())
                .orElseThrow(() -> new ResourceNotFoundException("TestExecution not found"));

        if (exec.getStatus() != TestExecutionStatus.PENDING)
            return;

        exec.setStatus(TestExecutionStatus.RUNNING);
        exec.setStartedAt(LocalDateTime.now());
        testExecutionRepository.save(exec);

        try {
            notificationWebSocketHandler.sendToUser(
                    testRun.getCreatedBy().getId(),
                    objectMapper.writeValueAsString(TestRunProgressEvent.builder()
                            .type("TEST_EXECUTION_STARTED")
                            .testRunId(testRunId)
                            .testExecutionId(exec.getId())
                            .testCaseId(exec.getTestCase().getId())
                            .testCaseName(exec.getTestCase().getTitle())
                            .status("RUNNING")
                            .correlationId(testRun.getCorrelationId())
                            .build()));
        } catch (Exception e) {
            log.error("Failed to send WebSocket event for execution start {}", exec.getId(), e);
        }
    }

    @Override
    @Transactional
    public void receiveExecutionResult(Long testRunId, ExecutionResultRequest request) {
        Optional<TestExecution> existingOpt = testExecutionRepository.findByIdempotencyKeyWithTestCase(request.idempotencyKey());

        // ─── DIAGNOSTIC LOG ───
        log.info("▶▶▶ receiveExecutionResult called: testRunId={}, idempotencyKey={}, outcome={}",
                testRunId, request.idempotencyKey(), request.outcome());
        if (existingOpt.isPresent()) {
            TestExecution ex = existingOpt.get();
            TestRun tr = ex.getTestRun();
            log.info("▶▶▶ Execution found: id={}, currentStatus={}, isTerminal={}",
                    ex.getId(), ex.getStatus(), ex.getStatus().isTerminal());
            log.info("▶▶▶ TestRun status: id={}, status={}, isTerminal={}",
                    tr.getId(), tr.getStatus(), tr.getStatus().isTerminal());
        } else {
            log.warn("▶▶▶ Execution NOT FOUND for idempotencyKey={}", request.idempotencyKey());
        }
        // ─── END DIAGNOSTIC ───

        if (existingOpt.isPresent() && existingOpt.get().getStatus().isTerminal()) {
            log.info("Duplicate callback idempotencyKey={}, skipping", request.idempotencyKey());
            return;
        }

        TestExecution exec = existingOpt
                .orElseThrow(() -> new ResourceNotFoundException(
                        "TestExecution not found for key: " + request.idempotencyKey()));

        TestRun testRun = exec.getTestRun();
        if (!testRun.getId().equals(testRunId)) {
            log.warn("Mismatch: execution {} belongs to testRun {} but callback arrived at {}",
                    exec.getId(), testRun.getId(), testRunId);
            throw new BadRequestException("Execution does not belong to the specified TestRun");
        }

        if (testRun.getStatus().isTerminal()) {
            log.info("[{}] TestRun {} is terminal, ignoring late callback for execution {}",
                    testRun.getCorrelationId(), testRunId, exec.getId());
            return;
        }

        TestExecutionStatus resultStatus = switch (request.outcome().toUpperCase()) {
            case "PASSED" -> TestExecutionStatus.PASSED;
            case "SKIPPED" -> TestExecutionStatus.SKIPPED;
            default -> TestExecutionStatus.FAILED;
        };

        exec.setStatus(resultStatus);
        exec.setNotes(request.notes());
        exec.setScreenshotUrl(request.screenshotUrl());
        exec.setFailedStepIndex(request.failedStepIndex());
        exec.setEvidenceUrls(request.evidenceUrls());
        exec.setDurationMs(request.durationMs() != null ? request.durationMs()
                : (exec.getStartedAt() != null
                        ? Duration.between(exec.getStartedAt(), LocalDateTime.now()).toMillis()
                        : null));
        exec.setExecutedAt(LocalDateTime.now());
        // saveAndFlush để đảm bảo status được write vào DB trước khi
        // getStatusCountMap() chạy JPQL query — tránh stale read dẫn đến failedCount=0
        testExecutionRepository.saveAndFlush(exec);

        // Tăng completedCount
        testRunRepository.incrementCompletedCount(testRunId, LocalDateTime.now());

        // Xử lý Bug 2: Đọc lại completedCount mới nhất để gửi WS và check hoàn thành
        int currentCompletedCount = testRunRepository.getCompletedCount(testRunId);

        testRun = testRunRepository.findById(testRunId)
                .orElseThrow(() -> new ResourceNotFoundException("TestRun not found"));

        Map<TestExecutionStatus, Long> counts = getStatusCountMap(testRunId);
        int passed = counts.getOrDefault(TestExecutionStatus.PASSED, 0L).intValue();
        int failed = counts.getOrDefault(TestExecutionStatus.FAILED, 0L).intValue();
        int skipped = counts.getOrDefault(TestExecutionStatus.SKIPPED, 0L).intValue();
        int aborted = counts.getOrDefault(TestExecutionStatus.ABORTED, 0L).intValue();

        try {
            notificationWebSocketHandler.sendToUser(
                    testRun.getCreatedBy().getId(),
                    objectMapper.writeValueAsString(TestRunProgressEvent.builder()
                            .type("TEST_EXECUTION_COMPLETED")
                            .testRunId(testRunId)
                            .testExecutionId(exec.getId())
                            .testCaseId(exec.getTestCase().getId())
                            .testCaseName(exec.getTestCase().getTitle())
                            .status(resultStatus.name())
                            .notes(exec.getNotes())
                            .screenshotUrl(exec.getScreenshotUrl())
                            .failedStepIndex(exec.getFailedStepIndex())
                            .evidenceUrls(exec.getEvidenceUrls())
                            .durationMs(exec.getDurationMs())
                            .completedCount(currentCompletedCount) // Dùng giá trị atomic mới
                            .totalCount(testRun.getTotalTestCases())
                            .passedCount(passed)
                            .failedCount(failed)
                            .skippedCount(skipped)
                            .abortedCount(aborted)
                            .correlationId(testRun.getCorrelationId())
                            .build()));
        } catch (Exception e) {
            log.error("Failed to send WebSocket event for execution result {}", exec.getId(), e);
        }

        // Xử lý Bug 2: Check tổng TestRun hoàn thành dựa vào giá trị atomic mới
        if (currentCompletedCount >= testRun.getTotalTestCases() && !testRun.getStatus().isTerminal()) {
            testRun.setStatus(TestRunStatus.COMPLETED);
            testRun.setCompletedAt(LocalDateTime.now());
            testRunRepository.save(testRun);

            log.info("[{}] TestRun {} auto-COMPLETED all {} executions.",
                    testRun.getCorrelationId(), testRun.getId(), testRun.getTotalTestCases());

            try {
                notificationWebSocketHandler.sendToUser(
                        testRun.getCreatedBy().getId(),
                        objectMapper.writeValueAsString(TestRunProgressEvent.builder()
                                .type("TEST_RUN_COMPLETED")
                                .testRunId(testRunId)
                                .finalStatus("COMPLETED")
                                .totalCount(testRun.getTotalTestCases())
                                .completedCount(currentCompletedCount) // Dùng giá trị atomic mới
                                .passedCount(passed)
                                .failedCount(failed)
                                .skippedCount(skipped)
                                .abortedCount(aborted)
                                .correlationId(testRun.getCorrelationId())
                                .build()));
            } catch (Exception e) {
                log.error("Failed to send TEST_RUN_COMPLETED WebSocket event for TestRun {}", testRunId, e);
            }
        }
    }

    @Override
    @Transactional
    public void cancelTestRun(Long testRunId, Long requestingUserId) {
        TestRun testRun = testRunRepository.findById(testRunId)
                .orElseThrow(() -> new ResourceNotFoundException("TestRun not found"));

        if (!testRun.getCreatedBy().getId().equals(requestingUserId)) {
            boolean isMember = projectMemberRepository
                    .findByProjectIdAndUserId(testRun.getProject().getId(), requestingUserId)
                    .isPresent();
            if (!isMember) {
                throw new ForbiddenException("Only project members can cancel a test run");
            }
        }
        if (testRun.getStatus().isTerminal()) {
            throw new BadRequestException("TestRun is already in terminal state: " + testRun.getStatus());
        }

        testRun.setStatus(TestRunStatus.CANCELLED);
        testRun.setCompletedAt(LocalDateTime.now());
        testRunRepository.save(testRun);

        int abortedCount = testExecutionRepository.abortPendingAndRunningByTestRunId(
                testRunId, "Cancelled by user");

        log.info("[{}] TestRun {} CANCELLED by user {}, {} executions ABORTED",
                testRun.getCorrelationId(), testRunId, requestingUserId, abortedCount);

        Map<TestExecutionStatus, Long> counts = getStatusCountMap(testRunId);

        try {
            notificationWebSocketHandler.sendToUser(
                    testRun.getCreatedBy().getId(),
                    objectMapper.writeValueAsString(TestRunProgressEvent.builder()
                            .type("TEST_RUN_COMPLETED")
                            .testRunId(testRunId)
                            .finalStatus("CANCELLED")
                            .passedCount(counts.getOrDefault(TestExecutionStatus.PASSED, 0L).intValue())
                            .failedCount(counts.getOrDefault(TestExecutionStatus.FAILED, 0L).intValue())
                            .skippedCount(counts.getOrDefault(TestExecutionStatus.SKIPPED, 0L).intValue())
                            .abortedCount(counts.getOrDefault(TestExecutionStatus.ABORTED, 0L).intValue())
                            .correlationId(testRun.getCorrelationId())
                            .build()));
        } catch (Exception e) {
            log.error("Failed to send WebSocket event for cancelled TestRun {}", testRunId, e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TestRunStatusResponse getTestRunStatus(Long testRunId) {
        TestRun testRun = testRunRepository.findById(testRunId)
                .orElseThrow(() -> new ResourceNotFoundException("TestRun not found"));

        List<TestExecution> executions = testExecutionRepository.findByTestRunIdWithTestCase(testRunId);

        Map<TestExecutionStatus, Long> counts = executions.stream()
                .collect(Collectors.groupingBy(TestExecution::getStatus, Collectors.counting()));

        List<TestRunStatusResponse.ExecutionStatusItem> items = executions.stream()
                .map(exec -> new TestRunStatusResponse.ExecutionStatusItem(
                        exec.getId(),
                        exec.getTestCase() != null ? exec.getTestCase().getId() : null,
                        exec.getTestCase() != null ? exec.getTestCase().getTitle() : null,
                        exec.getStatus().name(),
                        exec.getNotes(),
                        exec.getScreenshotUrl(),
                        exec.getDurationMs(),
                        exec.getOrderIndex(),
                        exec.getFailedStepIndex(),
                        exec.getEvidenceUrls()))
                .toList();

        return new TestRunStatusResponse(
                testRun.getId(),
                testRun.getStatus().name(),
                testRun.getCorrelationId(),
                testRun.getTotalTestCases(),
                testRun.getCompletedCount(),
                counts.getOrDefault(TestExecutionStatus.PASSED, 0L).intValue(),
                counts.getOrDefault(TestExecutionStatus.FAILED, 0L).intValue(),
                counts.getOrDefault(TestExecutionStatus.SKIPPED, 0L).intValue(),
                counts.getOrDefault(TestExecutionStatus.ABORTED, 0L).intValue(),
                testRun.getStartedAt(),
                testRun.getCompletedAt(),
                testRun.getErrorMessage(),
                testRun.getBugReportId(),
                testRun.getIsSaved(),
                items);
    }

    private Map<TestExecutionStatus, Long> getStatusCountMap(Long testRunId) {
        return testExecutionRepository.countByTestRunIdGroupByStatus(testRunId)
                .stream()
                .collect(Collectors.toMap(
                        row -> (TestExecutionStatus) row[0],
                        row -> (Long) row[1]));
    }

    @Override
    @Transactional
    public void saveTestRun(Long testRunId) {
        TestRun testRun = testRunRepository.findById(testRunId)
                .orElseThrow(() -> new ResourceNotFoundException("TestRun not found"));
        testRun.setIsSaved(true);
        testRunRepository.save(testRun);

        List<TestExecution> executions = testExecutionRepository.findByTestRunIdWithTestCase(testRunId);
        for (TestExecution execution : executions) {
            org.example.backend.entity.TestCase testCase = execution.getTestCase();
            if (execution.getStatus() == TestExecutionStatus.PASSED) {
                testCase.setStatus(org.example.backend.entity.enums.TestCaseStatus.PASS);
                testCaseRepository.save(testCase);
            } else if (execution.getStatus() == TestExecutionStatus.FAILED) {
                testCase.setStatus(org.example.backend.entity.enums.TestCaseStatus.FAIL);
                testCaseRepository.save(testCase);
            }
        }
    }

    @Override
    @Transactional
    public String analyzeError(Long testRunId, Long requestingUserId) {
        TestRun testRun = testRunRepository.findById(testRunId)
                .orElseThrow(() -> new ResourceNotFoundException("TestRun not found"));

        if (!testRun.getCreatedBy().getId().equals(requestingUserId)) {
            throw new ForbiddenException("Only the creator can analyze this run");
        }

        if (testRun.getAiAnalysis() != null) {
            return testRun.getAiAnalysis();
        }

        List<TestExecution> executions = testExecutionRepository.findByTestRunIdWithTestCaseAndSteps(testRunId);

        TestExecution failedExec = executions.stream()
                .filter(e -> e.getStatus() == TestExecutionStatus.FAILED)
                .findFirst()
                .orElse(null);

        if (failedExec == null || failedExec.getNotes() == null) {
            return "Không có thông tin lỗi để phân tích. (Hoặc step chưa lưu chi tiết lỗi)";
        }

        String analysis = aiTestAnalysisService.analyzeTestError(
                failedExec.getTestCase().getTitle(),
                failedExec.getTestCase().getExpectedResult(),
                failedExec.getNotes(),
                failedExec.getFailedStepIndex());

        testRun.setAiAnalysis(analysis);
        testRunRepository.save(testRun);

        return analysis;
    }
}
