package org.example.backend.service;

import org.example.backend.dto.testing.CreateTestRunRequest;
import org.example.backend.dto.testing.TestRunResponse;
import org.example.backend.dto.testing.TestRunStatusResponse;
import org.example.backend.dto.testing.internal.ExecutionResultRequest;
import org.example.backend.dto.testing.internal.StartExecutionRequest;
import org.example.backend.dto.testing.internal.TestRunExecutionPlan;
import org.example.backend.dto.testing.internal.UpdateTestRunStatusRequest;

public interface TestRunService {
    TestRunResponse createTestRun(CreateTestRunRequest request, Long userId);
    TestRunExecutionPlan getExecutionPlan(Long testRunId);
    void updateTestRunStatus(Long testRunId, UpdateTestRunStatusRequest request);
    void startExecution(Long testRunId, StartExecutionRequest request);
    void receiveExecutionResult(Long testRunId, ExecutionResultRequest request);
    void cancelTestRun(Long testRunId, Long requestingUserId);
    TestRunStatusResponse getTestRunStatus(Long testRunId);
    void saveTestRun(Long testRunId);
}
