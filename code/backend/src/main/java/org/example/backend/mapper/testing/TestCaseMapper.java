package org.example.backend.mapper.testing;

import org.example.backend.dto.testing.*;
import org.example.backend.entity.TestCase;
import org.example.backend.entity.TestStep;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.Requirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@Transactional
public class TestCaseMapper {

    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private UserAccountRepository userAccountRepository;
    
    @Autowired
    private RequirementRepository requirementRepository;

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
        if (request.getApiMethod() != null) tc.setApiMethod(request.getApiMethod());
        if (request.getApiUrl() != null) tc.setApiUrl(request.getApiUrl());
        try {
            if (request.getApiHeaders() != null) tc.setApiHeaders(objectMapper.writeValueAsString(request.getApiHeaders()));
            if (request.getApiQueryParams() != null) tc.setApiQueryParams(objectMapper.writeValueAsString(request.getApiQueryParams()));
            if (request.getApiBody() != null) tc.setApiBody(objectMapper.writeValueAsString(request.getApiBody()));
            if (request.getApiAssertions() != null) tc.setApiAssertions(objectMapper.writeValueAsString(request.getApiAssertions()));
        } catch (Exception e) {
            log.error("Failed to serialize API configuration for TestCase", e);
            throw new RuntimeException("Failed to serialize API configuration", e);
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
        if (request.getApiMethod() != null) tc.setApiMethod(request.getApiMethod());
        if (request.getApiUrl() != null) tc.setApiUrl(request.getApiUrl());
        try {
            if (request.getApiHeaders() != null) tc.setApiHeaders(objectMapper.writeValueAsString(request.getApiHeaders()));
            if (request.getApiQueryParams() != null) tc.setApiQueryParams(objectMapper.writeValueAsString(request.getApiQueryParams()));
            if (request.getApiBody() != null) tc.setApiBody(objectMapper.writeValueAsString(request.getApiBody()));
            if (request.getApiAssertions() != null) tc.setApiAssertions(objectMapper.writeValueAsString(request.getApiAssertions()));
        } catch (Exception e) {
            log.error("Failed to serialize API configuration for TestCase update", e);
            throw new RuntimeException("Failed to serialize API configuration", e);
        }
    }

    public TestCaseResponse toResponse(TestCase tc) {
        TestCaseResponse res = new TestCaseResponse();
        res.setId(tc.getId());
        res.setProjectId(tc.getProjectId());
        res.setCode(tc.getTcCode());
        res.setTitle(tc.getTitle());
        res.setType(tc.getType());
        res.setPrecondition(tc.getPrecondition());
        res.setExpectedResult(tc.getExpectedResult());
        res.setStatus(tc.getStatus());
        res.setSteps(tc.getSteps().stream().map(this::toStepResponse).toList());
        
        if (tc.getCreatedBy() != null) {
            UserAccount user = userAccountRepository.findById(tc.getCreatedBy()).orElse(null);
            if (user != null) {
                res.setCreatedBy(new UserShortResponse(user.getId(), user.getUsername()));
            }
        }
        
        if (tc.getRequirementId() != null) {
            Requirement req = requirementRepository.findById(tc.getRequirementId()).orElse(null);
            if (req != null) {
                res.setRequirement(new RequirementShortResponse(req.getId(), req.getReqCode(), req.getTitle()));
            }
        }
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
        res.setApiMethod(tc.getApiMethod());
        res.setApiUrl(tc.getApiUrl());
        try {
            if (tc.getApiHeaders() != null) res.setApiHeaders(objectMapper.readValue(tc.getApiHeaders(), Object.class));
            if (tc.getApiQueryParams() != null) res.setApiQueryParams(objectMapper.readValue(tc.getApiQueryParams(), Object.class));
            if (tc.getApiBody() != null) res.setApiBody(objectMapper.readValue(tc.getApiBody(), Object.class));
            if (tc.getApiAssertions() != null) res.setApiAssertions(objectMapper.readValue(tc.getApiAssertions(), Object.class));
        } catch (Exception e) {}
        return res;
    }

    public TestCaseListItemResponse toListItem(TestCase tc) {
        TestCaseListItemResponse res = new TestCaseListItemResponse();
        res.setId(tc.getId());
        res.setCode(tc.getTcCode());
        res.setTitle(tc.getTitle());
        
        if (tc.getRequirementId() != null) {
            Requirement req = requirementRepository.findById(tc.getRequirementId()).orElse(null);
            res.setRequirementCode(req != null ? req.getReqCode() : "REQ-" + tc.getRequirementId());
        } else {
            res.setRequirementCode(null);
        }
        
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
