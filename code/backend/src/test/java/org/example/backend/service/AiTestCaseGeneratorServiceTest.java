package org.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.testing.AiDraftTestCase;
import org.example.backend.dto.testing.AiTestCaseGenerateRequest;
import org.example.backend.dto.testing.AiTestCaseGenerateResponse;
import org.example.backend.entity.enums.TestType;
import org.example.backend.repository.AiGenerationStagingRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.repository.UseCaseRepository;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiTestCaseGeneratorServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RequirementRepository requirementRepository = mock(RequirementRepository.class);
    private final UseCaseRepository useCaseRepository = mock(UseCaseRepository.class);
    private final AiGenerationStagingRepository stagingRepository = mock(AiGenerationStagingRepository.class);
    private final TestCaseRepository testCaseRepository = mock(TestCaseRepository.class);
    private final AiRoutingService aiRoutingService = mock(AiRoutingService.class);

    private final AiTestCaseGeneratorService service = new AiTestCaseGeneratorService(
            objectMapper,
            requirementRepository,
            useCaseRepository,
            stagingRepository,
            testCaseRepository,
            aiRoutingService
    );

    @Test
    void generateTestCasesRepairsBlankUiSelectorsPathAndValuesFromSourceContext() {
        when(aiRoutingService.generateText(anyString())).thenReturn("""
                {
                  "reasoning": "REQUIREMENT ANALYSIS:\\nTest login flow",
                  "coverageSummary": "Covers login UI",
                  "testCases": [
                    {
                      "title": "User Management & Authentication - Secure Login with Valid Credentials",
                      "requirementId": 44,
                      "type": "UI",
                      "precondition": "User has a valid account",
                      "expectedResult": "User is redirected to dashboard after successful login",
                      "coveredAcceptanceCriteria": ["AC-1"],
                      "scenarioType": "positive",
                      "configuration": {
                        "type": "UI",
                        "baseUrl": "http://localhost:5173",
                        "steps": [
                          { "order": 1, "action": "goto", "path": "Path (e.g. /login)", "description": "Open login page" },
                          { "order": 2, "action": "fill", "selector": "Selector (e.g. #email)", "value": "Value to input", "description": "Enter valid username" },
                          { "order": 3, "action": "fill", "selector": "", "value": "", "description": "Enter valid password" },
                          { "order": 4, "action": "click", "selector": "", "description": "Click login button" },
                          { "order": 5, "action": "expect_text", "selector": "[class='login-success']", "expected": "", "description": "Verify successful login redirects to dashboard" }
                        ]
                      },
                      "steps": [
                        { "stepNumber": 1, "description": "Open login page" },
                        { "stepNumber": 2, "description": "Enter valid username" },
                        { "stepNumber": 3, "description": "Enter valid password" },
                        { "stepNumber": 4, "description": "Click login button" },
                        { "stepNumber": 5, "description": "Verify successful login redirects to dashboard" }
                      ]
                    }
                  ]
                }
                """);

        AiTestCaseGenerateRequest request = new AiTestCaseGenerateRequest();
        request.setTestType(TestType.UI);

        AiTestCaseGenerateResponse response = service.generateTestCases(request, loginSelectorContext(), null, null);

        assertThat(response.getTestCases()).hasSize(1);
        AiDraftTestCase draft = response.getTestCases().get(0);
        JsonNode steps = objectMapper.valueToTree(draft.getConfiguration()).path("steps");

        assertThat(steps.get(0).path("path").asText()).isEqualTo("/login");
        assertThat(steps.get(1).path("selector").asText()).isEqualTo("[name='input']");
        assertThat(steps.get(1).path("value").asText()).isEqualTo("testuser");
        assertThat(steps.get(2).path("selector").asText()).isEqualTo("[name='password']");
        assertThat(steps.get(2).path("value").asText()).isEqualTo("password123");
        assertThat(steps.get(3).path("selector").asText()).isEqualTo("button:has-text('Sign In')");
        assertThat(steps.get(4).path("action").asText()).isEqualTo("expect_url");
        assertThat(steps.get(4).path("expected").asText()).isEqualTo("/dashboard");
        assertThat(draft.getValidationStatus()).isEqualTo("VALID");
    }

    @Test
    void generateTestCasesRepairsNaturalLanguageUiActionsFromSourceContext() {
        when(aiRoutingService.generateText(anyString())).thenReturn("""
                {
                  "reasoning": "REQUIREMENT ANALYSIS:\\nProvider returned natural UI action labels",
                  "coverageSummary": "Covers login UI",
                  "testCases": [
                    {
                      "title": "UI - Secure User Login - Successful login with valid credentials",
                      "requirementId": 44,
                      "type": "UI",
                      "precondition": "User has a valid account",
                      "expectedResult": "User is redirected to dashboard after successful login",
                      "coveredAcceptanceCriteria": ["AC-1"],
                      "scenarioType": "positive",
                      "configuration": {
                        "type": "UI",
                        "steps": [
                          { "order": 1, "action": "Navigate (goto)", "path": "Path (e.g. /login)", "description": "Navigate to the login page" },
                          { "order": 2, "action": "Input (fill)", "selector": "", "value": "", "description": "Enter valid username (simulated as search input data)" },
                          { "order": 3, "action": "Input (fill)", "selector": "", "value": "", "description": "Enter valid password (simulated as search input data)" },
                          { "order": 4, "action": "Click", "selector": "", "description": "Click login/submit button (simulated as search button)" },
                          { "order": 5, "action": "", "expected": "", "description": "Verify successful login redirects to dashboard" }
                        ]
                      },
                      "steps": [
                        { "stepNumber": 1, "description": "Navigate to the login page" },
                        { "stepNumber": 2, "description": "Enter valid username" },
                        { "stepNumber": 3, "description": "Enter valid password" },
                        { "stepNumber": 4, "description": "Click login button" },
                        { "stepNumber": 5, "description": "Verify successful login redirects to dashboard" }
                      ]
                    }
                  ]
                }
                """);

        AiTestCaseGenerateRequest request = new AiTestCaseGenerateRequest();
        request.setTestType(TestType.UI);

        AiTestCaseGenerateResponse response = service.generateTestCases(request, loginSelectorContext(), null, null);

        AiDraftTestCase draft = response.getTestCases().get(0);
        JsonNode steps = objectMapper.valueToTree(draft.getConfiguration()).path("steps");

        assertThat(steps.get(0).path("action").asText()).isEqualTo("goto");
        assertThat(steps.get(0).path("path").asText()).isEqualTo("/login");
        assertThat(steps.get(1).path("action").asText()).isEqualTo("fill");
        assertThat(steps.get(1).path("selector").asText()).isEqualTo("[name='input']");
        assertThat(steps.get(1).path("value").asText()).isEqualTo("testuser");
        assertThat(steps.get(2).path("selector").asText()).isEqualTo("[name='password']");
        assertThat(steps.get(2).path("value").asText()).isEqualTo("password123");
        assertThat(steps.get(3).path("action").asText()).isEqualTo("click");
        assertThat(steps.get(3).path("selector").asText()).isEqualTo("button:has-text('Sign In')");
        assertThat(steps.get(4).path("action").asText()).isEqualTo("expect_url");
        assertThat(steps.get(4).path("expected").asText()).isEqualTo("/dashboard");
        assertThat(draft.getValidationMessages()).isEmpty();
        assertThat(draft.getValidationStatus()).isEqualTo("VALID");
    }

    @Test
    void generateTestCasesParsesLenientAiJsonAndKeepsUiGrounding() {
        when(aiRoutingService.generateText(anyString())).thenReturn("""
                {
                  reasoning: 'REQUIREMENT ANALYSIS:\\nLenient JSON from provider',
                  coverageSummary: 'Covers login UI',
                  testCases: [
                    {
                      title: 'Successful Login',
                      requirementId: 44,
                      type: 'UI',
                      precondition: 'User has a valid account',
                      expectedResult: 'User reaches dashboard',
                      scenarioType: 'positive',
                      configuration: {
                        type: 'UI',
                        steps: [
                          { order: 1, action: 'goto', path: '/login', description: 'Open login page' },
                          { order: 2, action: 'fill', selector: '[name=\\'input\\']', value: 'testuser', description: 'Enter valid username' },
                          { order: 3, action: 'fill', selector: '[name=\\'password\\']', value: 'password123', description: 'Enter valid password' },
                          { order: 4, action: 'click', selector: 'button:has-text(\\'Sign In\\')', description: 'Click sign in' },
                          { order: 5, action: 'expect_url', expected: '/dashboard', description: 'Verify dashboard redirect' },
                        ],
                      },
                      steps: [
                        { stepNumber: 1, description: 'Open login page' },
                        { stepNumber: 2, description: 'Enter valid username' },
                        { stepNumber: 3, description: 'Enter valid password' },
                        { stepNumber: 4, description: 'Click sign in' },
                        { stepNumber: 5, description: 'Verify dashboard redirect' },
                      ],
                    },
                  ],
                }
                """);

        AiTestCaseGenerateRequest request = new AiTestCaseGenerateRequest();
        request.setTestType(TestType.UI);

        AiTestCaseGenerateResponse response = service.generateTestCases(request, loginSelectorContext(), null, null);

        AiDraftTestCase draft = response.getTestCases().get(0);
        JsonNode steps = objectMapper.valueToTree(draft.getConfiguration()).path("steps");

        assertThat(draft.getType()).isEqualTo(TestType.UI);
        assertThat(steps.get(1).path("selector").asText()).isEqualTo("[name='input']");
        assertThat(steps.get(2).path("selector").asText()).isEqualTo("[name='password']");
        assertThat(draft.getValidationStatus()).isEqualTo("VALID");
    }

    @Test
    void generateTestCasesNormalizesApiConfigurationFromScannedApiContext() {
        when(aiRoutingService.generateText(anyString())).thenReturn("""
                {
                  "reasoning": "REQUIREMENT ANALYSIS:\\nComplete lesson API",
                  "coverageSummary": "Covers API endpoint",
                  "testCases": [
                    {
                      "title": "Complete lesson successfully",
                      "type": "API",
                      "precondition": "Student is enrolled in the course",
                      "expectedResult": "Response status is 200",
                      "scenarioType": "positive",
                      "configuration": {
                        "type": "API",
                        "apiBody": {}
                      },
                      "steps": [
                        { "stepNumber": 1, "description": "Send POST /api/complete-lesson for a student and resource" },
                        { "stepNumber": 2, "description": "Verify response status is 200" }
                      ]
                    }
                  ]
                }
                """);

        AiTestCaseGenerateRequest request = new AiTestCaseGenerateRequest();
        request.setTestType(TestType.API);
        request.setRequirementId(44L);

        AiTestCaseGenerateResponse response = service.generateTestCases(request, null, apiKnowledgeContext(), null);

        AiDraftTestCase draft = response.getTestCases().get(0);
        JsonNode config = objectMapper.valueToTree(draft.getConfiguration());

        assertThat(draft.getType()).isEqualTo(TestType.API);
        assertThat(config.path("type").asText()).isEqualTo("API");
        assertThat(config.path("apiMethod").asText()).isEqualTo("POST");
        assertThat(config.path("apiUrl").asText()).isEqualTo("http://localhost:8080/api/complete-lesson");
        assertThat(config.path("apiBody").has("studentId")).isTrue();
        assertThat(config.path("apiBody").has("resourceId")).isTrue();
        assertThat(config.path("apiAssertions").isArray()).isTrue();
        assertThat(config.path("apiAssertions").get(0).path("type").asText()).isEqualTo("STATUS_CODE");
        assertThat(draft.getValidationMessages()).isEmpty();
        assertThat(draft.getValidationStatus()).isEqualTo("VALID");
    }

    private String loginSelectorContext() {
        return """
                STRUCTURED FORM MAP - extracted verbatim from actual source code.
                Each element includes a pre-computed SELECTOR field.

                FILE: src/main/webapp/views/auth/login.jsp
                  FORM action="${pageContext.request.contextPath}/login" method=post
                    [username_or_email_field] tag=input type=text name="input"
                      label: "Email or Username"
                      SELECTOR (copy exactly): [name='input']
                    [password_field] tag=input type=password name="password"
                      label: "Password"
                      SELECTOR (copy exactly): [name='password']
                    [submit_button] tag=button type=submit
                      text: "Sign In"
                      SELECTOR (copy exactly): button:has-text('Sign In')
                """;
    }

    private String apiKnowledgeContext() {
        return """
                API KNOWLEDGE - extracted by static analysis of backend source code.

                ENDPOINT 1: POST /api/complete-lesson
                  Controller: CompleteLessonServlet.doPost()
                  Description: Complete lesson
                  Auth: Public (no authentication required)
                  Request Body: ServletRequestParameters
                    studentId (String, optional)
                    resourceId (String, optional)
                  Expected Status: [200]
                """;
    }
}
