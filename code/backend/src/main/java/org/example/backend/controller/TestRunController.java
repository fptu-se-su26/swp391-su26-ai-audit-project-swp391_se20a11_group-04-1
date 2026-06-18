package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.testing.CreateTestRunRequest;
import org.example.backend.dto.testing.TestRunResponse;
import org.example.backend.dto.testing.TestRunStatusResponse;
import org.example.backend.dto.testing.TestRunHistoryResponse;
import org.example.backend.entity.TestRun;
import org.example.backend.exception.UnauthorizedException;
import org.example.backend.repository.TestExecutionRepository;
import org.example.backend.repository.TestRunRepository;
import org.example.backend.service.TestRunService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/test-runs")
@RequiredArgsConstructor
public class TestRunController {

    private final TestRunService testRunService;
    private final TestRunRepository testRunRepository;
    private final TestExecutionRepository testExecutionRepository;

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
    public ResponseEntity<ApiResponse<List<TestRunHistoryResponse>>> getHistory(
            @PathVariable Long testCaseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpSession session) {
        validateSession(session);
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        Page<TestRun> testRunPage = testRunRepository.findByTestCaseIdAndIsSavedTrueOrderByStartedAtDesc(testCaseId, pageable);
        List<TestRun> runs = testRunPage.getContent();
        
        if (runs.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of(), "Lấy lịch sử run thành công."));
        }

        List<Long> runIds = runs.stream().map(TestRun::getId).toList();
        List<Object[]> countsData = testExecutionRepository.countByTestRunIdsGroupByStatus(runIds);
        
        // Map<RunId, Map<Status, Count>>
        Map<Long, Map<String, Long>> countsByRun = countsData.stream()
            .collect(Collectors.groupingBy(
                row -> (Long) row[0],
                Collectors.toMap(
                    row -> ((org.example.backend.entity.enums.TestExecutionStatus) row[1]).name(),
                    row -> (Long) row[2]
                )
            ));

        List<TestRunHistoryResponse> response = runs.stream().map(run -> {
            Long durationMs = null;
            if (run.getStartedAt() != null && run.getCompletedAt() != null) {
                durationMs = java.time.Duration.between(run.getStartedAt(), run.getCompletedAt()).toMillis();
            }
            
            Map<String, Long> runCounts = countsByRun.getOrDefault(run.getId(), Map.of());
            
            return TestRunHistoryResponse.builder()
                    .id(run.getId())
                    .status(run.getStatus().name())
                    .startedAt(run.getStartedAt())
                    .completedAt(run.getCompletedAt())
                    .durationMs(durationMs)
                    .passedCount(runCounts.getOrDefault("PASSED", 0L).intValue())
                    .failedCount(runCounts.getOrDefault("FAILED", 0L).intValue())
                    .isSaved(run.getIsSaved())
                    .build();
        }).toList();
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy lịch sử run thành công."));
    }

    @PostMapping("/{testRunId}/analyze-error")
    public ResponseEntity<ApiResponse<String>> analyzeError(
            @PathVariable Long testRunId,
            HttpSession session) {
        Long userId = validateSession(session);
        String analysis = testRunService.analyzeError(testRunId, userId);
        return ResponseEntity.ok(ApiResponse.success(analysis, "Analysis complete"));
    }
}
