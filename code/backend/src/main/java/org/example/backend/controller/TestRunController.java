package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.response.TestRunStatusResponse;
import org.example.backend.entity.TestRun;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.TestRunRepository;
import org.example.backend.service.TestRunService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/test-cases")
@RequiredArgsConstructor
public class TestRunController {

    private final TestRunService testRunService;
    private final TestRunRepository testRunRepository;

    /**
     * POST /api/v1/test-cases/{id}/run
     * Bắt đầu run → trả về runId ngay
     */
    @PostMapping("/{id}/run")
    public ResponseEntity<ApiResponse<Map<String, String>>> startRun(
            @PathVariable Long id,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        String runId = testRunService.startTestRun(id, userId);

        return ResponseEntity.accepted()
            .body(ApiResponse.success(Map.of(
                "runId", runId,
                "pollUrl", "/api/v1/test-cases/runs/" + runId + "/status"
            ), "Bắt đầu chạy auto test."));
    }

    /**
     * GET /api/v1/test-cases/runs/{runId}/status
     * Frontend polling mỗi 1 giây
     */
    @GetMapping("/runs/{runId}/status")
    public ResponseEntity<ApiResponse<TestRunStatusResponse>> getStatus(
            @PathVariable String runId,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        TestRunStatusResponse result = testRunService.getStatus(runId, null);
        return ResponseEntity.ok(ApiResponse.success(result, "Lấy trạng thái thành công."));
    }

    /**
     * GET /api/v1/test-cases/{id}/runs
     * Lịch sử các lần run
     */
    @GetMapping("/{id}/runs")
    public ResponseEntity<ApiResponse<List<TestRun>>> getHistory(
            @PathVariable Long id,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        List<TestRun> runs = testRunRepository
            .findByTestCaseIdOrderByStartedAtDesc(id);
        return ResponseEntity.ok(ApiResponse.success(runs, "Lấy lịch sử run thành công."));
    }
}
