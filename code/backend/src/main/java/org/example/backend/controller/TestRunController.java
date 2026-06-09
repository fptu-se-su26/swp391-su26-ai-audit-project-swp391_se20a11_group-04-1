package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.testing.CreateTestRunRequest;
import org.example.backend.dto.testing.TestRunResponse;
import org.example.backend.dto.testing.TestRunStatusResponse;
import org.example.backend.entity.TestRun;
import org.example.backend.exception.UnauthorizedException;
import org.example.backend.repository.TestRunRepository;
import org.example.backend.service.TestRunService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/test-runs")
@RequiredArgsConstructor
public class TestRunController {

    private final TestRunService testRunService;
    private final TestRunRepository testRunRepository;

    private Long validateSession(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này.");
        }
        return userId;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TestRunResponse>> createTestRun(
            @Valid @RequestBody CreateTestRunRequest request,
            HttpSession session) {
        Long userId = validateSession(session);
        TestRunResponse response = testRunService.createTestRun(request, userId);
        return ResponseEntity.accepted()
            .body(ApiResponse.success(response, "Test run accepted"));
    }

    @GetMapping("/{testRunId}")
    public ResponseEntity<ApiResponse<TestRunStatusResponse>> getTestRunStatus(
            @PathVariable Long testRunId,
            HttpSession session) {
        validateSession(session);
        TestRunStatusResponse response = testRunService.getTestRunStatus(testRunId);
        return ResponseEntity.ok(ApiResponse.success(response, "Success"));
    }

    @DeleteMapping("/{testRunId}")
    public ResponseEntity<ApiResponse<Void>> cancelTestRun(
            @PathVariable Long testRunId,
            HttpSession session) {
        Long userId = validateSession(session);
        testRunService.cancelTestRun(testRunId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Test run cancelled successfully"));
    }

    @PostMapping("/{testRunId}/save")
    public ResponseEntity<ApiResponse<Void>> saveTestRun(
            @PathVariable Long testRunId,
            HttpSession session) {
        validateSession(session);
        testRunService.saveTestRun(testRunId);
        return ResponseEntity.ok(ApiResponse.success(null, "Test run saved successfully"));
    }

    @GetMapping("/test-cases/{testCaseId}")
    public ResponseEntity<ApiResponse<List<TestRun>>> getHistory(
            @PathVariable Long testCaseId,
            HttpSession session) {
        validateSession(session);
        List<TestRun> runs = testRunRepository.findByTestCaseIdAndIsSavedTrueOrderByStartedAtDesc(testCaseId);
        return ResponseEntity.ok(ApiResponse.success(runs, "Lấy lịch sử run thành công."));
    }
}
