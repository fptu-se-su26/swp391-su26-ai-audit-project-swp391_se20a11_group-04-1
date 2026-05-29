package org.example.backend.service.impl;

import org.example.backend.dto.TaskRequest;
import org.example.backend.dto.TaskResponse;
import org.example.backend.entity.*;
import org.example.backend.entity.enums.BugSeverity;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.entity.enums.Environment;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.GitHubApiService;
import org.example.backend.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BugReportServiceImpl — Unit Tests")
class BugReportServiceImplTest {

    @Mock
    private BugReportRepository bugReportRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TestExecutionRepository testExecutionRepository;

    @Mock
    private TaskService taskService;

    @Mock
    private GitHubApiService gitHubApiService;

    @InjectMocks
    private BugReportServiceImpl bugReportService;

    private UserAccount mockUser;
    private Project mockProject;
    private ProjectMember mockLeaderMember;
    private ProjectMember mockNormalMember;
    private BugReport mockBugReport;

    @BeforeEach
    void setUp() {
        mockUser = new UserAccount();
        mockUser.setId(1L);
        mockUser.setUsername("datnt");
        mockUser.setEmail("leader@fpt.edu.vn");

        mockProject = new Project();
        mockProject.setId(100L);
        mockProject.setName("DevTrack Project");

        ProjectRole leaderRole = new ProjectRole();
        leaderRole.setName("PROJECT_LEADER");

        mockLeaderMember = ProjectMember.builder()
                .id(10L)
                .project(mockProject)
                .user(mockUser)
                .role(leaderRole)
                .build();

        ProjectRole memberRole = new ProjectRole();
        memberRole.setName("DEVELOPER");

        mockNormalMember = ProjectMember.builder()
                .id(11L)
                .project(mockProject)
                .user(mockUser)
                .role(memberRole)
                .build();

        mockBugReport = BugReport.builder()
                .id(500L)
                .project(mockProject)
                .title("Database connection leak detected")
                .description("RAM consumption spike due to unclosed JDBC connections")
                .severity(BugSeverity.CRITICAL)
                .environment(Environment.DEV)
                .createdBy(mockUser)
                .status(BugStatus.OPEN)
                .build();
    }

    @Test
    @DisplayName("getBugReport — Success when user is project member")
    void getBugReport_Success() {
        // GIVEN
        when(bugReportRepository.findById(500L)).thenReturn(Optional.of(mockBugReport));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockLeaderMember));

        // WHEN
        BugReport result = bugReportService.getBugReport(500L, 1L);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(500L);
        assertThat(result.getTitle()).isEqualTo("Database connection leak detected");
        verify(bugReportRepository, times(1)).findById(500L);
    }

    @Test
    @DisplayName("getBugReport — Throws FORBIDDEN when user is not a project member")
    void getBugReport_Forbidden() {
        // GIVEN
        when(bugReportRepository.findById(500L)).thenReturn(Optional.of(mockBugReport));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.empty());

        // WHEN & THEN
        assertThatThrownBy(() -> bugReportService.getBugReport(500L, 1L))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("You are not a member of this project")
                .extracting(e -> ((CustomException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("getProjectBugReports — Success")
    void getProjectBugReports_Success() {
        // GIVEN
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockLeaderMember));
        when(bugReportRepository.findByProjectId(100L)).thenReturn(List.of(mockBugReport));

        // WHEN
        List<BugReport> results = bugReportService.getProjectBugReports(100L, 1L);

        // THEN
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getId()).isEqualTo(500L);
        verify(bugReportRepository, times(1)).findByProjectId(100L);
    }

    @Test
    @DisplayName("createBugReport — Success")
    void createBugReport_Success() {
        // GIVEN
        Map<String, Object> request = new HashMap<>();
        request.put("title", "NullPointerException in AuthController");
        request.put("description", "Occurs when session token is missing");
        request.put("severity", "HIGH");
        request.put("environment", "STAGING");

        when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockLeaderMember));
        when(projectRepository.findById(100L)).thenReturn(Optional.of(mockProject));
        when(userAccountRepository.findById(1L)).thenReturn(Optional.of(mockUser));

        when(bugReportRepository.save(any(BugReport.class))).thenAnswer(invocation -> {
            BugReport saved = invocation.getArgument(0);
            saved.setId(501L);
            return saved;
        });

        // WHEN
        BugReport result = bugReportService.createBugReport(100L, request, 1L);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(501L);
        assertThat(result.getTitle()).isEqualTo("NullPointerException in AuthController");
        assertThat(result.getSeverity()).isEqualTo(BugSeverity.HIGH);
        assertThat(result.getEnvironment()).isEqualTo(Environment.STAGING);
        verify(bugReportRepository, times(1)).save(any(BugReport.class));
    }

    @Test
    @DisplayName("approveAndConvertBug — Success as Leader")
    void approveAndConvertBug_Success() {
        // GIVEN
        when(bugReportRepository.findById(500L)).thenReturn(Optional.of(mockBugReport));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockLeaderMember));

        TaskResponse mockTaskResponse = TaskResponse.builder()
                .id(200L)
                .title("[BUG] Database connection leak detected")
                .build();
        when(taskService.createTask(eq(100L), any(TaskRequest.class), eq(1L))).thenReturn(mockTaskResponse);

        Task mockTask = new Task();
        mockTask.setId(200L);
        when(taskRepository.findById(200L)).thenReturn(Optional.of(mockTask));

        when(bugReportRepository.save(any(BugReport.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // WHEN
        BugReport approved = bugReportService.approveAndConvertBug(500L, 1L);

        // THEN
        assertThat(approved).isNotNull();
        assertThat(approved.getRelatedTask()).isNotNull();
        assertThat(approved.getRelatedTask().getId()).isEqualTo(200L);
        assertThat(approved.getStatus()).isEqualTo(BugStatus.OPEN);

        // Verify task request values
        ArgumentCaptor<TaskRequest> taskRequestCaptor = ArgumentCaptor.forClass(TaskRequest.class);
        verify(taskService, times(1)).createTask(eq(100L), taskRequestCaptor.capture(), eq(1L));
        TaskRequest capturedReq = taskRequestCaptor.getValue();
        assertThat(capturedReq.getTitle()).isEqualTo("[BUG] Database connection leak detected");
        assertThat(capturedReq.getType()).isEqualTo("BUG_FIX");
        assertThat(capturedReq.getPriority()).isEqualTo("HIGH"); // CRITICAL severity maps to HIGH priority

        // Verify GitHub outbound sync is triggered
        verify(gitHubApiService, times(1)).createGitHubIssue(any(BugReport.class), eq(1L));
        verify(bugReportRepository, times(1)).save(any(BugReport.class));
    }

    @Test
    @DisplayName("approveAndConvertBug — Throws FORBIDDEN when calling member is not a Project Leader")
    void approveAndConvertBug_Forbidden() {
        // GIVEN
        when(bugReportRepository.findById(500L)).thenReturn(Optional.of(mockBugReport));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 1L)).thenReturn(Optional.of(mockNormalMember));

        // WHEN & THEN
        assertThatThrownBy(() -> bugReportService.approveAndConvertBug(500L, 1L))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("Only Project Leaders are authorized to approve and convert bug reports")
                .extracting(e -> ((CustomException) e).getStatus())
                .isEqualTo(HttpStatus.FORBIDDEN);

        verify(taskService, never()).createTask(any(), any(), any());
        verify(gitHubApiService, never()).createGitHubIssue(any(), any());
    }
}
