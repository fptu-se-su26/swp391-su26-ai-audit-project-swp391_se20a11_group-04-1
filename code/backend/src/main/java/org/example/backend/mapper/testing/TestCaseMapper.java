package org.example.backend.mapper.testing;

import org.example.backend.dto.testing.*;
import org.example.backend.entity.TestCase;
import org.example.backend.entity.TestStep;
import org.springframework.stereotype.Component;

@Component
public class TestCaseMapper {

    public TestCase toEntity(TestCaseRequest request) {
        TestCase tc = new TestCase();
        tc.setTitle(request.getTitle());
        tc.setType(request.getType());
        tc.setPrecondition(request.getPrecondition());
        tc.setExpectedResult(request.getExpectedResult());
        tc.setRequirementId(request.getRequirementId());
        return tc;
    }

    public void updateEntity(TestCase tc, TestCaseRequest request) {
        tc.setTitle(request.getTitle());
        tc.setType(request.getType());
        tc.setPrecondition(request.getPrecondition());
        tc.setExpectedResult(request.getExpectedResult());
        tc.setRequirementId(request.getRequirementId());
    }

    public TestCaseResponse toResponse(TestCase tc) {
        TestCaseResponse res = new TestCaseResponse();
        res.setId(tc.getId());
        res.setCode("TC-" + String.format("%02d", tc.getId()));
        res.setTitle(tc.getTitle());
        res.setType(tc.getType());
        res.setPrecondition(tc.getPrecondition());
        res.setExpectedResult(tc.getExpectedResult());
        res.setStatus(tc.getStatus());
        res.setSteps(tc.getSteps().stream().map(this::toStepResponse).toList());
        
        // Mocking user and requirement objects as requested, since we only have IDs mapped to prevent out-of-scope tasks.
        res.setCreatedBy(new UserShortResponse(tc.getCreatedBy(), "User-" + tc.getCreatedBy()));
        res.setRequirement(new RequirementShortResponse(tc.getRequirementId(), "REQ-" + tc.getRequirementId(), "Requirement " + tc.getRequirementId()));
        
        res.setCreatedAt(tc.getCreatedAt());
        res.setUpdatedAt(tc.getUpdatedAt());
        
        // Mock last execution as it is handled by another task
        res.setLastExecutedBy(null);
        res.setLastExecutedAt(null);
        return res;
    }

    public TestCaseListItemResponse toListItem(TestCase tc) {
        TestCaseListItemResponse res = new TestCaseListItemResponse();
        res.setId(tc.getId());
        res.setCode("TC-" + String.format("%02d", tc.getId()));
        res.setTitle(tc.getTitle());
        res.setRequirementCode("REQ-" + tc.getRequirementId());
        res.setType(tc.getType());
        res.setStatus(tc.getStatus());
        
        // Mock last execution as it is handled by another task
        res.setLastExecutedBy(null);
        res.setLastExecutedAt(null);
        return res;
    }

    private TestStepResponse toStepResponse(TestStep step) {
        TestStepResponse res = new TestStepResponse();
        res.setId(step.getId());
        res.setStepNumber(step.getStepNumber());
        res.setDescription(step.getDescription());
        return res;
    }
}
