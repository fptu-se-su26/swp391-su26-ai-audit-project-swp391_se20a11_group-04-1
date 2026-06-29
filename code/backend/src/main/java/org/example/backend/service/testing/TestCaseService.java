package org.example.backend.service.testing;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.testing.TestCaseListItemResponse;
import org.example.backend.dto.testing.TestCaseRequest;
import org.example.backend.dto.testing.TestCaseResponse;
import org.example.backend.dto.testing.TestStepRequest;
import org.example.backend.entity.TestCase;
import org.example.backend.entity.TestStep;
import org.example.backend.entity.enums.TestCaseStatus;
import org.example.backend.entity.enums.TestType;
import org.example.backend.exception.BusinessException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.mapper.testing.TestCaseMapper;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.repository.TestStepRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TestCaseService {

    private final TestCaseRepository testCaseRepository;
    private final TestStepRepository testStepRepository;
    private final TestCaseMapper testCaseMapper;
    private final org.example.backend.repository.ProjectRepository projectRepository;

    public TestCaseResponse create(Long projectId, TestCaseRequest request, Long currentUserId) {
        // TODO: Validate member of project (skipped to avoid conflict with project module)
        // TODO: Validate requirement exists in project (skipped to avoid conflict with requirement module)

        TestCase testCase = testCaseMapper.toEntity(request);
        testCase.setProjectId(projectId);
        testCase.setCreatedBy(currentUserId);
        testCase.setStatus(TestCaseStatus.NOT_RUN);

        List<TestStep> steps = buildSteps(request.getSteps(), testCase);
        testCase.setSteps(steps);

        // Pessimistic Lock on Project
        var project = projectRepository.findByIdWithPessimisticWrite(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Integer maxSubId = testCaseRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        testCase.setProjectSubId(nextSubId);
        testCase.setTcCode("TC-" + nextSubId);

        TestCase saved = testCaseRepository.save(testCase);
        return testCaseMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<TestCaseListItemResponse> list(Long projectId, TestCaseStatus status,
                                               TestType type, Long requirementId,
                                               Pageable pageable) {
        Page<TestCase> page = testCaseRepository
                .findByProjectWithFilters(projectId, status, type, requirementId, pageable);

        // TODO: Load last execution data (TestExecution) here when the TestExecution module is implemented.
        
        return page.map(testCaseMapper::toListItem);
    }

    @Transactional(readOnly = true)
    public TestCaseResponse getById(Long projectId, Long testCaseId) {
        TestCase tc = testCaseRepository.findByIdAndProjectId(testCaseId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found"));

        return testCaseMapper.toResponse(tc);
    }

    public TestCaseResponse update(Long projectId, Long testCaseId,
                                   TestCaseRequest request, Long currentUserId) {
        // TODO: Validate member of project
        
        TestCase tc = testCaseRepository.findByIdAndProjectId(testCaseId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found"));

        testCaseMapper.updateEntity(tc, request);

        // Replace steps: xóa cũ, thêm mới
        testStepRepository.deleteAllByTestCaseId(testCaseId);
        tc.getSteps().clear();
        tc.getSteps().addAll(buildSteps(request.getSteps(), tc));

        TestCase saved = testCaseRepository.save(tc);
        return testCaseMapper.toResponse(saved);
    }

    public void delete(Long projectId, Long testCaseId, Long currentUserId) {
        // TODO: Validate member of project

        TestCase tc = testCaseRepository.findByIdAndProjectId(testCaseId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found"));

        // TODO: Guard check bug report linkage when BugReport module is complete
        // if (testExecutionRepository.existsBugByTestCaseId(testCaseId)) { ... }

        testCaseRepository.delete(tc);
    }

    private List<TestStep> buildSteps(List<TestStepRequest> stepRequests, TestCase tc) {
        List<TestStep> steps = new ArrayList<>();
        if (stepRequests != null) {
            for (int i = 0; i < stepRequests.size(); i++) {
                TestStepRequest req = stepRequests.get(i);
                TestStep step = new TestStep();
                step.setTestCase(tc);
                step.setStepNumber(req.getStepNumber() != null ? req.getStepNumber() : i + 1);
                step.setDescription(req.getDescription());
                steps.add(step);
            }
        }
        return steps;
    }
}
