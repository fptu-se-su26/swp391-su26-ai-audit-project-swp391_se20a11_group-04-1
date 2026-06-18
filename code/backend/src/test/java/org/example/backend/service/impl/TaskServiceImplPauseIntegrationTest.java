package org.example.backend.service.impl;

import org.example.backend.dto.TaskStatusUpdateRequest;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectMember;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.sla.TaskSlaEvaluation;
import org.example.backend.service.sla.TaskSlaCategory;
import org.example.backend.service.sla.TaskSlaPauseService;
import org.example.backend.service.sla.TaskSlaRuleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskServiceImpl — SLA Pause Hook Integration Tests")
class TaskServiceImplPauseIntegrationTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private TaskSlaPauseService taskSlaPauseService;

    @Mock
    private TaskSlaRuleService taskSlaRuleService;

    @Mock
    private org.example.backend.repository.ProjectRepository projectRepository;
    @Mock
    private org.example.backend.repository.UserAccountRepository userAccountRepository;
    @Mock
    private org.example.backend.repository.RequirementRepository requirementRepository;
    @Mock
    private org.example.backend.repository.SprintRepository sprintRepository;
    @Mock
    private org.example.backend.repository.BugReportRepository bugReportRepository;
    @Mock
    private org.example.backend.service.github.GitHubApiService gitHubApiService;
    @Mock
    private org.example.backend.repository.KanbanColumnRepository kanbanColumnRepository;
    @Mock
    private org.example.backend.service.impl.KanbanColumnServiceImpl kanbanColumnService;
    @Mock
    private org.example.backend.repository.EvidenceRepository evidenceRepository;
    @Mock
    private org.example.backend.repository.EvidenceLinkRepository evidenceLinkRepository;
    @Mock
    private org.example.backend.repository.TaskReviewDecisionRepository taskReviewDecisionRepository;
    @Mock
    private org.example.backend.repository.ProjectCodeInsightSettingsRepository codeInsightSettingsRepository;
    @Mock
    private org.example.backend.repository.TaskCommentRepository taskCommentRepository;
    @Mock
    private org.example.backend.repository.TaskProposalRepository taskProposalRepository;
    @Mock
    private org.example.backend.service.NotificationService notificationService;
    @Mock
    private org.example.backend.service.event.OutboxEventService outboxEventService;

    @InjectMocks
    private TaskServiceImpl taskService;

    private Project project;
    private Task task;

    @BeforeEach
    void setUp() {
        project = Project.builder().id(100L).build();
        task = Task.builder()
                .id(1L)
                .project(project)
                .status(TaskStatus.IN_PROGRESS)
                .checklist(new ArrayList<>())
                .subTasks(new ArrayList<>())
                .assignees(new java.util.HashSet<>())
                .build();
    }

    @Test
    @DisplayName("Transition to BLOCKED should open pause log")
    void testTransitionToBlocked() {
        when(taskRepository.findWithDetailsById(1L)).thenReturn(Optional.of(task));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 5L))
                .thenReturn(Optional.of(new ProjectMember()));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(taskSlaRuleService.evaluate(any())).thenReturn(new TaskSlaEvaluation(EnumSet.of(TaskSlaCategory.NORMAL), 0L, false));

        TaskStatusUpdateRequest request = new TaskStatusUpdateRequest();
        request.setStatus("BLOCKED");
        request.setBlockedReason("Waiting on design team");

        taskService.updateTaskStatus(1L, request, 5L);

        verify(taskSlaPauseService).openPauseIfNeeded(task, "Waiting on design team");
        verify(taskSlaPauseService, never()).resumeOpenPauseIfNeeded(any());
    }

    @Test
    @DisplayName("Transition from BLOCKED should close/resume pause log")
    void testTransitionFromBlocked() {
        task.setStatus(TaskStatus.BLOCKED);
        task.setBlockedReason("Blocked reason");

        when(taskRepository.findWithDetailsById(1L)).thenReturn(Optional.of(task));
        when(projectMemberRepository.findByProjectIdAndUserId(100L, 5L))
                .thenReturn(Optional.of(new ProjectMember()));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(taskSlaRuleService.evaluate(any())).thenReturn(new TaskSlaEvaluation(EnumSet.of(TaskSlaCategory.NORMAL), 0L, false));

        TaskStatusUpdateRequest request = new TaskStatusUpdateRequest();
        request.setStatus("IN_PROGRESS");

        taskService.updateTaskStatus(1L, request, 5L);

        verify(taskSlaPauseService).resumeOpenPauseIfNeeded(task);
        verify(taskSlaPauseService, never()).openPauseIfNeeded(any(), any());
    }
}
