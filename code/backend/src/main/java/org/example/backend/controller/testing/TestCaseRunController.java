package org.example.backend.controller.testing;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.testing.CreateTestRunRequest;
import org.example.backend.dto.testing.TestRunResponse;
import org.example.backend.service.TestRunService;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.exception.ForbiddenException;
import org.example.backend.entity.TestCase;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.exception.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.List;

@RestController
@RequestMapping("/api/v1/test-cases")
@RequiredArgsConstructor
public class TestCaseRunController {

    private final TestRunService testRunService;
    private final TestCaseRepository testCaseRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @PostMapping("/{id}/run")
    public ResponseEntity<ApiResponse<TestRunResponse>> runTestCase(
            @PathVariable Long id,
            HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Chưa đăng nhập hệ thống");
        }

        TestCase tc = testCaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found"));

        if (projectMemberRepository.findByProjectIdAndUserId(tc.getProjectId(), userId).isEmpty()) {
            throw new ForbiddenException("Bạn không có quyền chạy test case của dự án này");
        }

        CreateTestRunRequest request = new CreateTestRunRequest(
            tc.getProjectId(),
            List.of(id),
            "Run TC-" + tc.getProjectSubId()
        );
        
        TestRunResponse response = testRunService.createTestRun(request, userId);
        return ResponseEntity.accepted()
            .body(ApiResponse.success(response, "Test case run started"));
    }
}
