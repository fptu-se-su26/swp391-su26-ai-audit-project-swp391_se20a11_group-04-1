package org.example.backend.service.sla;

import org.example.backend.entity.Project;
import org.example.backend.entity.Task;
import org.example.backend.entity.UserAccount;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.TaskPenaltyLogRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.NotificationService;
import org.example.backend.service.event.OutboxEventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.EnumSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskPenaltyService — Unit Tests")
class TaskPenaltyServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskPenaltyLogRepository taskPenaltyLogRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private OutboxEventService outboxEventService;

    @Mock
    private NotificationService notificationService;

    private TaskPenaltyService taskPenaltyService;

    @BeforeEach
    void setUp() {
        taskPenaltyService = new TaskPenaltyService(
                taskRepository,
                taskPenaltyLogRepository,
                projectMemberRepository,
                outboxEventService,
                notificationService
        );
    }

    @Test
    @DisplayName("Should apply penalty if task is overdue penalty and not already applied")
    void testApplyPenaltySuccess() {
        UserAccount assignee = UserAccount.builder().id(1L).username("testUser").build();
        Project project = Project.builder().id(10L).build();
        Task task = Task.builder()
                .id(100L)
                .project(project)
                .primaryAssignee(assignee)
                .overduePenaltyApplied(false)
                .build();

        TaskSlaEvaluation evaluation = new TaskSlaEvaluation(
                EnumSet.of(TaskSlaCategory.OVERDUE_PENALTY),
                3
        );

        when(taskPenaltyLogRepository.existsByTaskIdAndReason(any(), any())).thenReturn(false);

        taskPenaltyService.applyPenaltyIfNeeded(task, evaluation);

        assertThat(task.isOverduePenaltyApplied()).isTrue();
        assertThat(task.getOverduePenaltyAppliedAt()).isNotNull();
        verify(taskRepository, times(1)).save(task);
        verify(taskPenaltyLogRepository, times(1)).save(any());
        verify(outboxEventService, times(1)).createEvent(eq("TASK_PENALTY_APPLIED"), eq("Task"), eq(100L), any());
    }

    @Test
    @DisplayName("Should NOT apply penalty if task has already had penalty applied")
    void testApplyPenaltyAlreadyApplied() {
        UserAccount assignee = UserAccount.builder().id(1L).username("testUser").build();
        Project project = Project.builder().id(10L).build();
        Task task = Task.builder()
                .id(100L)
                .project(project)
                .primaryAssignee(assignee)
                .overduePenaltyApplied(true)
                .build();

        TaskSlaEvaluation evaluation = new TaskSlaEvaluation(
                EnumSet.of(TaskSlaCategory.OVERDUE_PENALTY),
                3
        );

        taskPenaltyService.applyPenaltyIfNeeded(task, evaluation);

        verify(taskRepository, never()).save(any());
        verify(taskPenaltyLogRepository, never()).save(any());
        verify(outboxEventService, never()).createEvent(any(), any(), any(), any());
    }
}
