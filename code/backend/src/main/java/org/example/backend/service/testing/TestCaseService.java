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
import org.example.backend.exception.BadRequestException;
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
import java.util.Map;
import java.util.HashMap;
import org.example.backend.dto.testing.RequirementTreeNodeResponse;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.entity.Requirement;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Service
@RequiredArgsConstructor
@Transactional
public class TestCaseService {

    private final TestCaseRepository testCaseRepository;
    private final TestStepRepository testStepRepository;
    private final TestCaseMapper testCaseMapper;
    private final org.example.backend.repository.ProjectRepository projectRepository;
    private final RequirementRepository requirementRepository;
    private final ObjectMapper objectMapper;

    public TestCaseResponse create(Long projectId, TestCaseRequest request, Long currentUserId) {
        // TODO: Validate member of project (skipped to avoid conflict with project module)
        validateRequirementBelongsToProject(projectId, request.getRequirementId());

        // Pessimistic Lock on Project FIRST to avoid building unsaved relationships before lock
        var project = projectRepository.findByIdWithPessimisticWrite(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        TestCase testCase = testCaseMapper.toEntity(request);
        testCase.setProjectId(projectId);
        testCase.setCreatedBy(currentUserId);
        testCase.setStatus(TestCaseStatus.NOT_RUN);

        Integer maxSubId = testCaseRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        testCase.setProjectSubId(nextSubId);
        testCase.setTcCode("TC-" + nextSubId);

        List<TestStep> steps = buildSteps(request.getSteps(), testCase);
        testCase.setSteps(steps);

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
    public List<RequirementTreeNodeResponse> getRequirementsTree(Long projectId) {
        List<Requirement> requirements = requirementRepository.findByProjectId(projectId);
        List<Object[]> stats = testCaseRepository.countStatusByRequirementId(projectId);

        // Group stats by requirementId
        // Stats: [requirementId, status, count]
        Map<Long, Map<TestCaseStatus, Integer>> reqStatsMap = new HashMap<>();
        for (Object[] row : stats) {
            Long reqId = (Long) row[0];
            TestCaseStatus status = (TestCaseStatus) row[1];
            Integer count = ((Number) row[2]).intValue();

            reqStatsMap.computeIfAbsent(reqId, k -> new HashMap<>()).put(status, count);
        }

        List<RequirementTreeNodeResponse> tree = new ArrayList<>();
        for (Requirement req : requirements) {
            Map<TestCaseStatus, Integer> reqStats = reqStatsMap.getOrDefault(req.getId(), new HashMap<>());
            int passedCount = reqStats.getOrDefault(TestCaseStatus.PASS, 0);
            int failedCount = reqStats.getOrDefault(TestCaseStatus.FAIL, 0);
            int notRunCount = reqStats.getOrDefault(TestCaseStatus.NOT_RUN, 0);
            int blockedCount = reqStats.getOrDefault(TestCaseStatus.BLOCKED, 0);
            
            // Note: In our current implementation, we treat NOT_RUN and BLOCKED separately from PASS/FAIL.
            // Some implementations might count BLOCKED in NOT_RUN or FAILED depending on context.
            // We'll expose notRunCount as (not_run + blocked) for MVP simplicity if needed, 
            // but the DTO only has passed, failed, notRun. Let's just sum them or keep them separate.
            int totalNotRunOrBlocked = notRunCount + blockedCount;
            int totalCases = passedCount + failedCount + totalNotRunOrBlocked;

            // Compute AC Coverage mock (heuristic based on test cases vs ACs)
            int acTotal = 0;
            int acCovered = 0;
            if (req.getAcceptanceCriteria() != null && !req.getAcceptanceCriteria().trim().isEmpty()) {
                try {
                    JsonNode acNode = objectMapper.readTree(req.getAcceptanceCriteria());
                    if (acNode.isArray()) {
                        acTotal = acNode.size();
                    } else {
                        // Fallback if not an array, just treat as 1 AC if not empty
                        acTotal = 1;
                    }
                } catch (Exception e) {
                    acTotal = 1; // Fallback
                }
            } else {
                acTotal = 0;
            }

            // Heuristic mapping: assume we cover min(totalCases, acTotal) ACs for MVP
            acCovered = Math.min(totalCases, acTotal);
            int coveragePercent = acTotal > 0 ? (int) Math.round((double) acCovered / acTotal * 100) : (totalCases > 0 ? 100 : 0);

            // Calculate Pass Rate and Health Score
            int passRate = totalCases > 0 ? (int) Math.round((double) passedCount / totalCases * 100) : 0;
            int healthScore = (int) Math.round((coveragePercent * 0.5) + (passRate * 0.5));

            // Determine Risk Level based on Health Score
            String riskLevel = "LOW";
            if (totalCases == 0 && acTotal > 0) riskLevel = "CRITICAL"; // Special case for complete lack of coverage
            else if (healthScore < 50) riskLevel = "CRITICAL";
            else if (healthScore < 70) riskLevel = "HIGH";
            else if (healthScore < 85) riskLevel = "MEDIUM";

            RequirementTreeNodeResponse node = RequirementTreeNodeResponse.builder()
                    .id(req.getId())
                    .reqCode(req.getReqCode())
                    .title(req.getTitle())
                    .priority(req.getPriority() != null ? req.getPriority().name() : "MEDIUM")
                    .testCaseCount(totalCases)
                    .passedCount(passedCount)
                    .failedCount(failedCount)
                    .notRunCount(totalNotRunOrBlocked)
                    .acTotal(acTotal)
                    .acCovered(acCovered)
                    .coveragePercent(coveragePercent)
                    .passRate(passRate)
                    .healthScore(healthScore)
                    .riskLevel(riskLevel)
                    .build();
            tree.add(node);
        }

        return tree;
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
        validateRequirementBelongsToProject(projectId, request.getRequirementId());
        
        TestCase tc = testCaseRepository.findByIdAndProjectId(testCaseId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Test case not found"));

        testCaseMapper.updateEntity(tc, request);

        // Replace steps: xóa cũ, thêm mới
        testStepRepository.deleteAllByTestCaseId(testCaseId);
        testStepRepository.flush(); // ensure deletes are committed before inserting new steps
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

    private void validateRequirementBelongsToProject(Long projectId, Long requirementId) {
        if (requirementId == null) {
            throw new BadRequestException("Requirement is required");
        }
        Requirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found"));
        if (requirement.getProject() == null || !projectId.equals(requirement.getProject().getId())) {
            throw new ResourceNotFoundException("Requirement not found");
        }
    }

    private List<TestStep> buildSteps(List<TestStepRequest> stepRequests, TestCase tc) {
        List<TestStep> steps = new ArrayList<>();
        if (stepRequests != null) {
            for (int i = 0; i < stepRequests.size(); i++) {
                TestStepRequest req = stepRequests.get(i);
                if (req == null || req.getDescription() == null || req.getDescription().trim().isEmpty()) {
                    throw new BadRequestException("Step description is required");
                }
                TestStep step = new TestStep();
                step.setTestCase(tc);
                step.setStepNumber(i + 1); // Unconditionally use i + 1 to guarantee unique sequencing
                step.setDescription(req.getDescription().trim());
                steps.add(step);
            }
        }
        return steps;
    }
}
