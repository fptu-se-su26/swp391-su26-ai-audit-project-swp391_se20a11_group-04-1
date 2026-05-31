package org.example.backend.mapper.testing;

import org.example.backend.dto.testing.*;
import org.example.backend.entity.TestCase;
import org.example.backend.entity.TestStep;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class TestCaseMapper {

    @Autowired
    private ObjectMapper objectMapper;

    public TestCase toEntity(TestCaseRequest request) {
        TestCase tc = new TestCase();
        tc.setTitle(request.getTitle());
        tc.setType(request.getType());
        tc.setPrecondition(request.getPrecondition());
        tc.setExpectedResult(request.getExpectedResult());
        tc.setRequirementId(request.getRequirementId());
        tc.setBaseUrl(request.getBaseUrl());
        if (request.getStepsStructured() != null) {
            try {
                tc.setStepsStructured(objectMapper.writeValueAsString(request.getStepsStructured()));
            } catch (Exception e) {}
        }
        return tc;
    }

    public void updateEntity(TestCase tc, TestCaseRequest request) {
        tc.setTitle(request.getTitle());
        tc.setType(request.getType());
        tc.setPrecondition(request.getPrecondition());
        tc.setExpectedResult(request.getExpectedResult());
        tc.setRequirementId(request.getRequirementId());
        tc.setBaseUrl(request.getBaseUrl());
        if (request.getStepsStructured() != null) {
            try {
                tc.setStepsStructured(objectMapper.writeValueAsString(request.getStepsStructured()));
            } catch (Exception e) {}
        }
    }

    public TestCaseResponse toResponse(TestCase tc) {
        TestCaseResponse res = new TestCaseResponse();
        res.setId(tc.getId());
        res.setCode(tc.getTcCode());
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
        res.setBaseUrl(tc.getBaseUrl());
        if (tc.getStepsStructured() != null) {
            try {
                res.setStepsStructured(objectMapper.readValue(tc.getStepsStructured(), Object.class));
            } catch (Exception e) {}
        }
        return res;
    }

    public TestCaseListItemResponse toListItem(TestCase tc) {
        TestCaseListItemResponse res = new TestCaseListItemResponse();
        res.setId(tc.getId());
        res.setCode(tc.getTcCode());
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
