package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.entity.*;
import org.example.backend.entity.enums.BugSeverity;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.entity.enums.Environment;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;
import org.springframework.test.util.ReflectionTestUtils;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GitHubApiServiceImpl — Webhook Unit Tests")
class GitHubApiServiceImplTest {

    @Mock
    private GitHubIntegrationRepository gitHubIntegrationRepository;

    @Mock
    private BugReportRepository bugReportRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private UserGithubTokenRepository userGithubTokenRepository;

    @Mock
    private org.springframework.web.client.RestTemplate restTemplate;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private GitHubApiServiceImpl gitHubApiService;

    private GitHubIntegration mockIntegration;
    private Project mockProject;
    private UserAccount mockUser;
    private BugReport mockBugReport;
    private ProjectMember mockLeaderMember;
    private UserGithubToken mockToken;

    private static final String WEBHOOK_SECRET = "superSecretWebhookKey";

    @BeforeEach
    void setUp() {
        mockUser = new UserAccount();
        mockUser.setId(1L);
        mockUser.setUsername("datnt");
        mockUser.setEmail("leader@fpt.edu.vn");

        mockProject = new Project();
        mockProject.setId(100L);
        mockProject.setName("DevTrack Project");

        ReflectionTestUtils.setField(gitHubApiService, "encryptionKey", "1234567890123456");
        ReflectionTestUtils.setField(gitHubApiService, "restTemplate", restTemplate);

        mockIntegration = GitHubIntegration.builder()
                .id(1L)
                .project(mockProject)
                .repoOwner("fptu-se-su26")
                .repoName("swp391-audit-project")
                .webhookSecretEncrypted(gitHubApiService.encryptToken(WEBHOOK_SECRET))
                .connectedBy(mockUser)
                .build();

        mockBugReport = BugReport.builder()
                .id(500L)
                .project(mockProject)
                .title("Database connection leak")
                .description("RAM consumption spike")
                .severity(BugSeverity.CRITICAL)
                .environment(Environment.DEV)
                .createdBy(mockUser)
                .status(BugStatus.OPEN)
                .stepsToReproduce("{\"github_issue_number\":12,\"github_issue_url\":\"https://github.com/fptu-se-su26/swp391-audit-project/issues/12\"}")
                .build();

        ProjectRole leaderRole = new ProjectRole();
        leaderRole.setName("PROJECT_LEADER");
        mockLeaderMember = new ProjectMember();
        mockLeaderMember.setRole(leaderRole);

        mockToken = new UserGithubToken();
        mockToken.setId(1L);
        mockToken.setAccessTokenEncrypted(gitHubApiService.encryptToken("ghp_valid_token"));
    }

    @Test
    @DisplayName("handleWebhook — Throws FORBIDDEN when signature calculated does not match header")
    void handleWebhook_SignatureMismatch_ThrowsForbidden() {
        String invalidSignature = "sha256=invalidSignatureHashValue12345";
        String event = "issues";
        String payload = "{\"repository\":{\"name\":\"swp391-audit-project\",\"owner\":{\"login\":\"fptu-se-su26\"}}}";

        lenient().when(gitHubIntegrationRepository.findAll()).thenReturn(List.of(mockIntegration));

        assertThatThrownBy(() -> gitHubApiService.handleWebhook(invalidSignature, event, payload.getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("Invalid webhook signature")
                .extracting(e -> ((CustomException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("handleWebhook — issues.opened successfully auto-creates BugReport and Task")
    void handleWebhook_IssuesOpened_Success() throws Exception {
        String payload = "{"
                + "\"action\":\"opened\","
                + "\"repository\":{\"name\":\"swp391-audit-project\",\"owner\":{\"login\":\"fptu-se-su26\"}},"
                + "\"issue\":{\"number\":15,\"html_url\":\"https://github.com/fptu-se-su26/swp391-audit-project/issues/15\",\"title\":\"[BUG] Null pointer exception\",\"body\":\"Occurs on login\"},"
                + "\"sender\":{\"login\":\"datnt\"}"
                + "}";

        String signature = calculateHmacSha256(payload, WEBHOOK_SECRET);

        lenient().when(gitHubIntegrationRepository.findAll()).thenReturn(List.of(mockIntegration));
        lenient().when(bugReportRepository.findByProjectId(100L)).thenReturn(new ArrayList<>());
        lenient().when(userAccountRepository.findByUsername("datnt")).thenReturn(Optional.of(mockUser));

        lenient().when(bugReportRepository.save(any(BugReport.class))).thenAnswer(invocation -> {
            BugReport bug = invocation.getArgument(0);
            if (bug.getId() == null) bug.setId(505L);
            return bug;
        });

        lenient().when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task task = invocation.getArgument(0);
            task.setId(205L);
            return task;
        });

        gitHubApiService.handleWebhook(signature, "issues", payload.getBytes(StandardCharsets.UTF_8));

        ArgumentCaptor<BugReport> bugCaptor = ArgumentCaptor.forClass(BugReport.class);
        verify(bugReportRepository, atLeast(1)).save(bugCaptor.capture());
        BugReport savedBug = bugCaptor.getAllValues().get(0);
        assertThat(savedBug.getTitle()).isEqualTo("Null pointer exception");

        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository, times(1)).save(taskCaptor.capture());
        Task savedTask = taskCaptor.getValue();
        assertThat(savedTask.getTitle()).isEqualTo("[BUG] Null pointer exception");
    }

    @Test
    @DisplayName("handleWebhook — issues.closed successfully marks BugReport CLOSED and Task DONE")
    void handleWebhook_IssuesClosed_Success() throws Exception {
        String payload = "{"
                + "\"action\":\"closed\","
                + "\"repository\":{\"name\":\"swp391-audit-project\",\"owner\":{\"login\":\"fptu-se-su26\"}},"
                + "\"issue\":{\"number\":12,\"html_url\":\"https://github.com/fptu-se-su26/swp391-audit-project/issues/12\"}"
                + "}";

        String signature = calculateHmacSha256(payload, WEBHOOK_SECRET);

        Task mockTask = new Task();
        mockTask.setId(200L);
        mockTask.setStatus(TaskStatus.IN_PROGRESS);
        mockBugReport.setRelatedTask(mockTask);

        lenient().when(gitHubIntegrationRepository.findAll()).thenReturn(List.of(mockIntegration));
        lenient().when(bugReportRepository.findByProjectId(100L)).thenReturn(List.of(mockBugReport));

        gitHubApiService.handleWebhook(signature, "issues", payload.getBytes(StandardCharsets.UTF_8));

        assertThat(mockBugReport.getStatus()).isEqualTo(BugStatus.CLOSED);
        assertThat(mockTask.getStatus()).isEqualTo(TaskStatus.DONE);
    }

    @Test
    @DisplayName("pingWebhook — Success")
    void pingWebhook_Success() {
        lenient().when(projectRepository.findById(100L)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(gitHubIntegrationRepository.findByProjectId(100L)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(1L)).thenReturn(Optional.of(mockToken));

        List<Map<String, Object>> mockHooks = new ArrayList<>();
        Map<String, Object> hook = new HashMap<>();
        hook.put("id", 123);
        Map<String, Object> config = new HashMap<>();
        config.put("url", "https://app.example.com/api/v1/github/webhook");
        hook.put("config", config);
        mockHooks.add(hook);
        
        ResponseEntity<List> getHooksResponse = new ResponseEntity<>(mockHooks, HttpStatus.OK);
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenReturn(getHooksResponse);

        ResponseEntity<Void> postPingResponse = new ResponseEntity<>(HttpStatus.NO_CONTENT);
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(postPingResponse);

        gitHubApiService.pingWebhook(100L, 1L);

        verify(restTemplate, times(1)).exchange(contains("/hooks/123/pings"), eq(HttpMethod.POST), any(HttpEntity.class), eq(Void.class));
    }

    @Test
    @DisplayName("getRateLimit — Success")
    void getRateLimit_Success() {
        lenient().when(projectRepository.findById(100L)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(gitHubIntegrationRepository.findByProjectId(100L)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(1L)).thenReturn(Optional.of(mockToken));

        Map<String, Object> rateData = new HashMap<>();
        Map<String, Object> resources = new HashMap<>();
        Map<String, Object> core = new HashMap<>();
        core.put("limit", 5000);
        core.put("remaining", 4999);
        resources.put("core", core);
        rateData.put("resources", resources);

        ResponseEntity<Map> responseEntity = new ResponseEntity<>(rateData, HttpStatus.OK);
        lenient().when(restTemplate.exchange(contains("/rate_limit"), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(responseEntity);

        Map<String, Object> result = gitHubApiService.getRateLimit(100L, 1L);

        assertThat(result).isNotNull();
        assertThat(result.get("limit")).isEqualTo(5000);
        assertThat(result.get("remaining")).isEqualTo(4999);
    }

    @Test
    @DisplayName("saveIntegration — Success creates new integration")
    void saveIntegration_Success() {
        lenient().when(projectRepository.findById(100L)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(userAccountRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        lenient().when(gitHubIntegrationRepository.findByProjectId(100L)).thenReturn(Optional.empty());

        Map<String, Object> request = new HashMap<>();
        request.put("repoOwner", "new-owner");
        request.put("repoName", "new-repo");
        request.put("accessToken", "ghp_new_token");
        request.put("webhookSecret", "newSecret");

        lenient().when(gitHubIntegrationRepository.save(any(GitHubIntegration.class))).thenAnswer(i -> i.getArgument(0));
        lenient().when(userGithubTokenRepository.findById(1L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(mockToken));
        lenient().when(userGithubTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<String> postHookResponse = new ResponseEntity<>("{}", HttpStatus.CREATED);
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(postHookResponse);
        
        GitHubIntegration result = gitHubApiService.saveIntegration(100L, request, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getRepoOwner()).isEqualTo("new-owner");
        assertThat(result.getWebhookSecretEncrypted()).isEqualTo(gitHubApiService.encryptToken("newSecret"));
        
        verify(userGithubTokenRepository, times(1)).save(any(UserGithubToken.class));
    }

    @Test
    @DisplayName("getIntegration — Returns integration correctly")
    void getIntegration_Success() {
        lenient().when(projectRepository.findById(100L)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(gitHubIntegrationRepository.findByProjectId(100L)).thenReturn(Optional.of(mockIntegration));

        GitHubIntegration result = gitHubApiService.getIntegration(100L, 1L);
        assertThat(result).isNotNull();
        assertThat(result.getRepoOwner()).isEqualTo("fptu-se-su26");
    }

    @Test
    @DisplayName("getWebhookDeliveryStatus — Returns Healthy status")
    void getWebhookDeliveryStatus_Success() {
        lenient().when(projectRepository.findById(100L)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(gitHubIntegrationRepository.findByProjectId(100L)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(1L)).thenReturn(Optional.of(mockToken));

        List<Map<String, Object>> mockHooks = new ArrayList<>();
        Map<String, Object> hook = new HashMap<>();
        Map<String, Object> config = new HashMap<>();
        config.put("url", "/api/v1/github/webhook");
        hook.put("config", config);
        
        Map<String, Object> lastResponse = new HashMap<>();
        lastResponse.put("status", "active");
        lastResponse.put("code", 200);
        hook.put("last_response", lastResponse);
        mockHooks.add(hook);

        ResponseEntity<List> responseEntity = new ResponseEntity<>(mockHooks, HttpStatus.OK);
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenReturn(responseEntity);

        Map<String, Object> result = gitHubApiService.getWebhookDeliveryStatus(100L, 1L);

        assertThat(result).isNotNull();
        assertThat(result.get("webhookStatus")).isEqualTo("HEALTHY");
    }

    @Test
    @DisplayName("createGitHubIssue — Success")
    void createGitHubIssue_Success() {
        lenient().when(gitHubIntegrationRepository.findByProjectId(100L)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(1L)).thenReturn(Optional.of(mockToken));

        Map<String, Object> githubResponse = new HashMap<>();
        githubResponse.put("number", 42);
        githubResponse.put("html_url", "https://github.com/issue/42");
        ResponseEntity<Map> responseEntity = new ResponseEntity<>(githubResponse, HttpStatus.CREATED);
        
        lenient().when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(responseEntity);

        gitHubApiService.createGitHubIssue(mockBugReport, 1L);

        verify(bugReportRepository, times(1)).save(mockBugReport);
        assertThat(mockBugReport.getStepsToReproduce()).contains("\"github_issue_number\":42");
    }

    private String calculateHmacSha256(String data, String key) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return "sha256=" + hexString.toString();
    }
}
