package org.example.backend.service.github.impl;

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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GitHubApiServiceImpl — Unit Tests (OAuth-based, no PAT)")
class GitHubApiServiceImplTest {

    @Mock private GitHubIntegrationRepository gitHubIntegrationRepository;
    @Mock private BugReportRepository bugReportRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserAccountRepository userAccountRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private UserGithubTokenRepository userGithubTokenRepository;
    @Mock private org.springframework.web.client.RestTemplate restTemplate;
    @Mock private org.example.backend.service.EncryptionService encryptionService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private GitHubApiServiceImpl gitHubApiService;

    private GitHubIntegration mockIntegration;
    private Project mockProject;
    private UserAccount mockUser;
    private BugReport mockBugReport;
    private ProjectMember mockLeaderMember;
    private UserGithubToken mockOAuthToken;

    private static final String WEBHOOK_SECRET = "superSecretWebhookKey";
    private static final Long PROJECT_ID = 100L;
    private static final Long USER_ID = 1L;

    @BeforeEach
    void setUp() {
        // User setup
        mockUser = new UserAccount();
        mockUser.setId(USER_ID);
        mockUser.setUsername("datnt");
        mockUser.setEmail("leader@fpt.edu.vn");

        // Project setup
        mockProject = new Project();
        mockProject.setId(PROJECT_ID);
        mockProject.setName("DevTrack Project");

        // Encryption logic mock
        lenient().when(encryptionService.encrypt(anyString())).thenAnswer(i -> "encrypted_" + i.getArgument(0));
        lenient().when(encryptionService.decrypt(anyString())).thenAnswer(i -> {
            String s = i.getArgument(0);
            return s.startsWith("encrypted_") ? s.substring("encrypted_".length()) : s;
        });

        // RestTemplate mock setup
        ReflectionTestUtils.setField(gitHubApiService, "restTemplate", restTemplate);

        // Integration (OAuth-based — no PAT field)
        mockIntegration = GitHubIntegration.builder()
                .id(1L)
                .project(mockProject)
                .repoOwner("mock-owner")
                .repoName("mock-repo")
                .webhookSecretEncrypted(encryptionService.encrypt(WEBHOOK_SECRET))
                .connectedBy(mockUser)
                .build();

        // BugReport with GitHub issue metadata in stepsToReproduce JSON field
        mockBugReport = BugReport.builder()
                .id(500L)
                .project(mockProject)
                .title("Database connection leak")
                .description("RAM consumption spike")
                .severity(BugSeverity.CRITICAL)
                .environment(Environment.DEV)
                .createdBy(mockUser)
                .status(BugStatus.OPEN)
                .stepsToReproduce("{\"github_issue_number\":12,\"github_issue_url\":\"https://github.com/mock-owner/mock-repo/issues/12\"}")
                .build();

        // Project leader role
        ProjectRole leaderRole = new ProjectRole();
        leaderRole.setName("PROJECT_LEADER");
        mockLeaderMember = new ProjectMember();
        mockLeaderMember.setRole(leaderRole);

        // OAuth token (no PAT — token obtained via GitHub OAuth flow)
        mockOAuthToken = new UserGithubToken();
        mockOAuthToken.setId(USER_ID);
        mockOAuthToken.setAccessTokenEncrypted(encryptionService.encrypt("gho_oauth_access_token"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. handleWebhook — Signature validation
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("handleWebhook — Throws FORBIDDEN when HMAC signature does not match")
    void handleWebhook_InvalidSignature_ThrowsForbidden() {
        String badSignature = "sha256=invalidvalue";
        String payload = "{\"repository\":{\"name\":\"mock-repo\",\"owner\":{\"login\":\"mock-owner\"}}}";

        lenient().when(gitHubIntegrationRepository.findAll()).thenReturn(List.of(mockIntegration));

        assertThatThrownBy(() ->
                gitHubApiService.handleWebhook(badSignature, "issues", payload.getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("Invalid webhook signature")
                .extracting(e -> ((CustomException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("handleWebhook — issues.opened auto-creates BugReport and linked Task")
    void handleWebhook_IssuesOpened_CreatesBugAndTask() throws Exception {
        String payload = "{"
                + "\"action\":\"opened\","
                + "\"repository\":{\"name\":\"mock-repo\",\"owner\":{\"login\":\"mock-owner\"}},"
                + "\"issue\":{\"number\":15,\"html_url\":\"https://github.com/mock-owner/mock-repo/issues/15\",\"title\":\"[BUG] Null pointer exception\",\"body\":\"Occurs on login\",\"labels\":[{\"name\":\"bug\"}]},"
                + "\"sender\":{\"login\":\"datnt\"}"
                + "}";

        String signature = hmac(payload, WEBHOOK_SECRET);

        lenient().when(gitHubIntegrationRepository.findAll()).thenReturn(List.of(mockIntegration));
        lenient().when(bugReportRepository.findByProjectId(PROJECT_ID)).thenReturn(new ArrayList<>());
        lenient().when(userAccountRepository.findByUsername("datnt")).thenReturn(Optional.of(mockUser));
        lenient().when(bugReportRepository.save(any(BugReport.class))).thenAnswer(inv -> {
            BugReport b = inv.getArgument(0);
            if (b.getId() == null) b.setId(505L);
            return b;
        });
        lenient().when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(205L);
            return t;
        });

        gitHubApiService.handleWebhook(signature, "issues", payload.getBytes(StandardCharsets.UTF_8));

        ArgumentCaptor<BugReport> bugCaptor = ArgumentCaptor.forClass(BugReport.class);
        verify(bugReportRepository, atLeast(1)).save(bugCaptor.capture());
        assertThat(bugCaptor.getAllValues().get(0).getTitle()).isEqualTo("Null pointer exception");

        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository, times(1)).save(taskCaptor.capture());
        assertThat(taskCaptor.getValue().getTitle()).isEqualTo("[BUG] Null pointer exception");
    }

    @Test
    @DisplayName("handleWebhook — issues.closed marks BugReport CLOSED and Task DONE")
    void handleWebhook_IssuesClosed_MarksBugClosedAndTaskDone() throws Exception {
        String payload = "{"
                + "\"action\":\"closed\","
                + "\"repository\":{\"name\":\"mock-repo\",\"owner\":{\"login\":\"mock-owner\"}},"
                + "\"issue\":{\"number\":12,\"html_url\":\"https://github.com/mock-owner/mock-repo/issues/12\"}"
                + "}";

        String signature = hmac(payload, WEBHOOK_SECRET);

        Task linkedTask = new Task();
        linkedTask.setId(200L);
        linkedTask.setStatus(TaskStatus.IN_PROGRESS);
        mockBugReport.setRelatedTask(linkedTask);

        lenient().when(gitHubIntegrationRepository.findAll()).thenReturn(List.of(mockIntegration));
        lenient().when(bugReportRepository.findByProjectId(PROJECT_ID)).thenReturn(List.of(mockBugReport));

        gitHubApiService.handleWebhook(signature, "issues", payload.getBytes(StandardCharsets.UTF_8));

        assertThat(mockBugReport.getStatus()).isEqualTo(BugStatus.CLOSED);
        assertThat(linkedTask.getStatus()).isEqualTo(TaskStatus.DONE);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. saveIntegration — OAuth, no accessToken in request
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("saveIntegration — Success: saves repoOwner, repoName and encrypted secret (no PAT in request)")
    void saveIntegration_OAuthFlow_Success() {
        lenient().when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(userAccountRepository.findById(USER_ID)).thenReturn(Optional.of(mockUser));
        lenient().when(gitHubIntegrationRepository.findByProjectId(PROJECT_ID)).thenReturn(Optional.empty());
        lenient().when(userGithubTokenRepository.findById(USER_ID)).thenReturn(Optional.of(mockOAuthToken));
        lenient().when(gitHubIntegrationRepository.save(any(GitHubIntegration.class))).thenAnswer(i -> i.getArgument(0));

        // Request body does NOT include accessToken — OAuth token already stored separately
        Map<String, Object> request = new HashMap<>();
        request.put("repoOwner", "new-org");
        request.put("repoName", "new-repo");
        request.put("webhookSecret", "mySecret123");

        GitHubIntegration result = gitHubApiService.saveIntegration(PROJECT_ID, request, USER_ID);

        assertThat(result).isNotNull();
        assertThat(result.getRepoOwner()).isEqualTo("new-org");
        assertThat(result.getRepoName()).isEqualTo("new-repo");
        assertThat(result.getWebhookSecretEncrypted()).isEqualTo("encrypted_mySecret123");
        // No UserGithubToken.save() call — token was already stored via OAuth
        verify(userGithubTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("saveIntegration — Fails when user has not linked GitHub account via OAuth")
    void saveIntegration_NoOAuthToken_ThrowsBadRequest() {
        lenient().when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(userAccountRepository.findById(USER_ID)).thenReturn(Optional.of(mockUser));
        lenient().when(gitHubIntegrationRepository.findByProjectId(PROJECT_ID)).thenReturn(Optional.empty());
        lenient().when(userGithubTokenRepository.findById(USER_ID)).thenReturn(Optional.empty()); // no OAuth token

        Map<String, Object> request = new HashMap<>();
        request.put("repoOwner", "owner");
        request.put("repoName", "repo");

        assertThatThrownBy(() -> gitHubApiService.saveIntegration(PROJECT_ID, request, USER_ID))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("must link your GitHub account")
                .extracting(e -> ((CustomException) e).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("saveIntegration — Updates existing integration (repoOwner/repoName change)")
    void saveIntegration_UpdatesExisting() {
        lenient().when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(userAccountRepository.findById(USER_ID)).thenReturn(Optional.of(mockUser));
        lenient().when(gitHubIntegrationRepository.findByProjectId(PROJECT_ID)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(USER_ID)).thenReturn(Optional.of(mockOAuthToken));
        lenient().when(gitHubIntegrationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> request = new HashMap<>();
        request.put("repoOwner", "updated-org");
        request.put("repoName", "updated-repo");

        GitHubIntegration result = gitHubApiService.saveIntegration(PROJECT_ID, request, USER_ID);

        assertThat(result.getRepoOwner()).isEqualTo("updated-org");
        assertThat(result.getRepoName()).isEqualTo("updated-repo");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. getIntegration
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getIntegration — Returns existing integration for project member")
    void getIntegration_Success() {
        lenient().when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(gitHubIntegrationRepository.findByProjectId(PROJECT_ID)).thenReturn(Optional.of(mockIntegration));

        GitHubIntegration result = gitHubApiService.getIntegration(PROJECT_ID, USER_ID);

        assertThat(result).isNotNull();
        assertThat(result.getRepoOwner()).isEqualTo("mock-owner");
        assertThat(result.getRepoName()).isEqualTo("mock-repo");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. pingWebhook — uses OAuth token
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("pingWebhook — Calls GitHub ping endpoint using OAuth token")
    void pingWebhook_Success_UsesOAuthToken() {
        lenient().when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(gitHubIntegrationRepository.findByProjectId(PROJECT_ID)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(USER_ID)).thenReturn(Optional.of(mockOAuthToken));

        List<Map<String, Object>> hooks = new ArrayList<>();
        Map<String, Object> hook = new HashMap<>();
        hook.put("id", 999);
        Map<String, Object> config = new HashMap<>();
        config.put("url", "https://app.example.com/api/v1/github/webhook");
        hook.put("config", config);
        hooks.add(hook);

        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenReturn(new ResponseEntity<>(hooks, HttpStatus.OK));
        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Void.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.NO_CONTENT));

        gitHubApiService.pingWebhook(PROJECT_ID, USER_ID);

        verify(restTemplate, times(1)).exchange(
                contains("/hooks/999/pings"), eq(HttpMethod.POST), any(HttpEntity.class), eq(Void.class));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. getRateLimit
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getRateLimit — Returns parsed remaining/limit from GitHub API")
    void getRateLimit_ReturnsCorrectValues() {
        lenient().when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(gitHubIntegrationRepository.findByProjectId(PROJECT_ID)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(USER_ID)).thenReturn(Optional.of(mockOAuthToken));

        Map<String, Object> core = new HashMap<>();
        core.put("limit", 5000);
        core.put("remaining", 4800);
        core.put("reset", 1748000000);
        Map<String, Object> resources = new HashMap<>();
        resources.put("core", core);
        Map<String, Object> rateData = new HashMap<>();
        rateData.put("resources", resources);

        lenient().when(restTemplate.exchange(contains("/rate_limit"), eq(HttpMethod.GET), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(rateData, HttpStatus.OK));

        Map<String, Object> result = gitHubApiService.getRateLimit(PROJECT_ID, USER_ID);

        assertThat(result).isNotNull();
        assertThat(result.get("limit")).isEqualTo(5000);
        assertThat(result.get("remaining")).isEqualTo(4800);
        assertThat(result.get("reset")).isEqualTo(1748000000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. getWebhookDeliveryStatus
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getWebhookDeliveryStatus — Returns HEALTHY when last_response.code is 200")
    void getWebhookDeliveryStatus_Healthy() {
        lenient().when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(mockProject));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(PROJECT_ID, USER_ID)).thenReturn(Optional.of(mockLeaderMember));
        lenient().when(gitHubIntegrationRepository.findByProjectId(PROJECT_ID)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(USER_ID)).thenReturn(Optional.of(mockOAuthToken));

        Map<String, Object> lastResponse = new HashMap<>();
        lastResponse.put("status", "active");
        lastResponse.put("code", 200);

        Map<String, Object> hook = new HashMap<>();
        Map<String, Object> config = new HashMap<>();
        config.put("url", "/api/v1/github/webhook");
        hook.put("config", config);
        hook.put("last_response", lastResponse);

        lenient().when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(List.class)))
                .thenReturn(new ResponseEntity<>(List.of(hook), HttpStatus.OK));

        Map<String, Object> result = gitHubApiService.getWebhookDeliveryStatus(PROJECT_ID, USER_ID);

        assertThat(result).isNotNull();
        assertThat(result.get("webhookStatus")).isEqualTo("HEALTHY");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. createGitHubIssue
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createGitHubIssue — Creates issue on GitHub and stores issue number in BugReport")
    void createGitHubIssue_StoresIssueNumber() {
        lenient().when(gitHubIntegrationRepository.findByProjectId(PROJECT_ID)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(USER_ID)).thenReturn(Optional.of(mockOAuthToken));

        Map<String, Object> githubResponse = new HashMap<>();
        githubResponse.put("number", 42);
        githubResponse.put("html_url", "https://github.com/mock-owner/mock-repo/issues/42");

        lenient().when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(githubResponse, HttpStatus.CREATED));

        gitHubApiService.createGitHubIssue(mockBugReport, USER_ID);

        verify(bugReportRepository, times(1)).save(mockBugReport);
        assertThat(mockBugReport.getStepsToReproduce()).contains("\"github_issue_number\":42");
    }

    @Test
    @DisplayName("updateGitHubIssueStatusForTask — Auto-creates GitHub issue if issue number is NULL (Self-Healing)")
    void updateGitHubIssueStatusForTask_NullIssueNumber_AutoCreatesIssue() {
        // GIVEN
        Task task = Task.builder()
                .id(99L)
                .title("Sub-task leak check")
                .type(TaskType.BUG_FIX)
                .project(mockProject)
                .checklist(new ArrayList<>())
                .githubIssueNumber(null) // NULL to trigger self-healing
                .build();

        lenient().when(gitHubIntegrationRepository.findByProjectId(PROJECT_ID)).thenReturn(Optional.of(mockIntegration));
        lenient().when(userGithubTokenRepository.findById(USER_ID)).thenReturn(Optional.of(mockOAuthToken));

        Map<String, Object> githubResponse = new HashMap<>();
        githubResponse.put("number", 88);
        githubResponse.put("html_url", "https://github.com/mock-owner/mock-repo/issues/88");

        lenient().when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(new ResponseEntity<>(githubResponse, HttpStatus.CREATED));

        // WHEN
        gitHubApiService.updateGitHubIssueStatusForTask(task, USER_ID);

        // THEN
        verify(taskRepository, times(1)).save(task);
        assertThat(task.getGithubIssueNumber()).isEqualTo(88);
        assertThat(task.getGithubIssueUrl()).isEqualTo("https://github.com/mock-owner/mock-repo/issues/88");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper
    // ─────────────────────────────────────────────────────────────────────────

    private String hmac(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder("sha256=");
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
