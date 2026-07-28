package org.example.backend.mapper.testing;

import org.example.backend.dto.testing.*;
import org.example.backend.dto.testing.config.*;
import org.example.backend.entity.enums.TestType;
import org.example.backend.entity.TestCase;
import org.example.backend.entity.TestStep;
import org.example.backend.entity.config.*;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.Requirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;

import java.util.Locale;

@Component
@Slf4j
@Transactional
public class TestCaseMapper {

    @Autowired
    private UserAccountRepository userAccountRepository;
    
    @Autowired
    private RequirementRepository requirementRepository;
    
    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

    public TestCase toEntity(TestCaseRequest request) {
        TestCase tc = new TestCase();
        tc.setTitle(request.getTitle());
        tc.setType(request.getType());
        tc.setPrecondition(request.getPrecondition());
        tc.setExpectedResult(request.getExpectedResult());
        tc.setRequirementId(request.getRequirementId());
        
        applyConfigToEntity(tc, request.getConfiguration(), request.getType());
        return tc;
    }

    public void updateEntity(TestCase tc, TestCaseRequest request) {
        tc.setTitle(request.getTitle());
        tc.setType(request.getType());
        tc.setPrecondition(request.getPrecondition());
        tc.setExpectedResult(request.getExpectedResult());
        tc.setRequirementId(request.getRequirementId());
        
        if (request.getConfiguration() != null) {
            applyConfigToEntity(tc, request.getConfiguration(), request.getType());
        } else {
            // Ensure entity type matches its config even if no config provided
            ensureCorrectConfigType(tc, request.getType());
        }
    }
    
    private void clearConfigs(TestCase tc) {
        if (tc.getUiConfig() != null || tc.getApiConfig() != null || tc.getUnitConfig() != null || tc.getIntegrationConfig() != null) {
            tc.setUiConfig(null);
            tc.setApiConfig(null);
            tc.setUnitConfig(null);
            tc.setIntegrationConfig(null);
            entityManager.flush();
        }
    }

    private void ensureCorrectConfigType(TestCase tc, TestType type) {
        boolean typeMismatch = false;
        
        if (type == TestType.UI && tc.getUiConfig() == null) typeMismatch = true;
        else if (type == TestType.API && tc.getApiConfig() == null) typeMismatch = true;
        else if (type == TestType.UNIT && tc.getUnitConfig() == null) typeMismatch = true;
        else if (type == TestType.INTEGRATION && tc.getIntegrationConfig() == null) typeMismatch = true;
        else if (type == TestType.MANUAL) typeMismatch = tc.getUiConfig() != null || tc.getApiConfig() != null || tc.getUnitConfig() != null || tc.getIntegrationConfig() != null;
        
        if (typeMismatch) {
            clearConfigs(tc);
            switch (type) {
                case UI -> {
                    UiTestConfig c = new UiTestConfig();
                    c.setTestCase(tc);
                    tc.setUiConfig(c);
                }
                case API -> {
                    ApiTestConfig c = new ApiTestConfig();
                    c.setTestCase(tc);
                    tc.setApiConfig(c);
                }
                case UNIT -> {
                    UnitTestConfig c = new UnitTestConfig();
                    c.setTestCase(tc);
                    tc.setUnitConfig(c);
                }
                case INTEGRATION -> {
                    IntegrationTestConfig c = new IntegrationTestConfig();
                    c.setTestCase(tc);
                    tc.setIntegrationConfig(c);
                }
                case MANUAL -> {
                    // Manual has no config table
                }
            }
        }
    }
    
    private void applyConfigToEntity(TestCase tc, TestConfiguration dtoConfig, TestType type) {
        if (dtoConfig == null) return;
        
        ensureCorrectConfigType(tc, type);
        
        if (type == TestType.UI && dtoConfig instanceof UiTestConfigDto uiDto) {
            tc.getUiConfig().setBaseUrl(uiDto.getBaseUrl());
            if (uiDto.getSteps() != null) tc.getUiConfig().setSteps(objectMapper.valueToTree(uiDto.getSteps()));
            tc.getUiConfig().setCachedPlaywrightScript(uiDto.getCachedPlaywrightScript());
            tc.getUiConfig().setScriptSource(uiDto.getScriptSource());
            tc.getUiConfig().setScriptGeneratedAt(uiDto.getScriptGeneratedAt());
        } else if (type == TestType.API && dtoConfig instanceof ApiTestConfigDto apiDto) {
            tc.getApiConfig().setApiMethod(!isBlank(apiDto.getApiMethod()) ? apiDto.getApiMethod().trim().toUpperCase(Locale.ROOT) : "GET");
            String apiUrl = firstNonBlank(apiDto.getApiUrl(), apiDto.getApiEndpoint());
            tc.getApiConfig().setApiUrl(apiUrl != null ? apiUrl.trim() : "");
            if (apiDto.getApiHeaders() != null) tc.getApiConfig().setApiHeaders(objectMapper.valueToTree(apiDto.getApiHeaders()));
            if (apiDto.getApiQueryParams() != null) tc.getApiConfig().setApiQueryParams(objectMapper.valueToTree(apiDto.getApiQueryParams()));
            if (apiDto.getApiBody() != null) tc.getApiConfig().setApiBody(objectMapper.valueToTree(apiDto.getApiBody()));
            if (apiDto.getApiAssertions() != null) tc.getApiConfig().setApiAssertions(objectMapper.valueToTree(apiDto.getApiAssertions()));
            else if (apiDto.getAssertions() != null) tc.getApiConfig().setApiAssertions(objectMapper.valueToTree(apiDto.getAssertions()));
        }
    }

    private String firstNonBlank(String first, String second) {
        return !isBlank(first) ? first : second;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
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
        res.setLastExecutedBy(tc.getLastRunId());
        res.setLastExecutedAt(tc.getLastRunAt());
        
        // Map entity config back to DTO
        if (tc.getType() == TestType.UI && tc.getUiConfig() != null) {
            UiTestConfigDto dto = new UiTestConfigDto();
            dto.setBaseUrl(tc.getUiConfig().getBaseUrl());
            dto.setSteps(objectMapper.convertValue(tc.getUiConfig().getSteps(), Object.class));
            dto.setCachedPlaywrightScript(tc.getUiConfig().getCachedPlaywrightScript());
            dto.setScriptSource(tc.getUiConfig().getScriptSource());
            dto.setScriptGeneratedAt(tc.getUiConfig().getScriptGeneratedAt());
            res.setConfiguration(dto);
        } else if (tc.getType() == TestType.API && tc.getApiConfig() != null) {
            ApiTestConfigDto dto = new ApiTestConfigDto();
            dto.setApiMethod(tc.getApiConfig().getApiMethod());
            dto.setApiUrl(tc.getApiConfig().getApiUrl());
            dto.setApiHeaders(objectMapper.convertValue(tc.getApiConfig().getApiHeaders(), Object.class));
            dto.setApiQueryParams(objectMapper.convertValue(tc.getApiConfig().getApiQueryParams(), Object.class));
            dto.setApiBody(objectMapper.convertValue(tc.getApiConfig().getApiBody(), Object.class));
            dto.setApiAssertions(objectMapper.convertValue(tc.getApiConfig().getApiAssertions(), Object.class));
            res.setConfiguration(dto);
        } else if (tc.getType() == TestType.MANUAL) {
            res.setConfiguration(new ManualTestConfigDto());
        } else if (tc.getType() == TestType.UNIT) {
            res.setConfiguration(new UnitTestConfigDto());
        } else if (tc.getType() == TestType.INTEGRATION) {
            res.setConfiguration(new IntegrationTestConfigDto());
        }
        
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
