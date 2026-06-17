package org.example.backend.service.sla;

import org.example.backend.entity.Project;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.example.backend.entity.UserAccount;
import org.example.backend.repository.SlaActionLogRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.example.backend.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.EnumSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SlaActionService — Unit Tests")
class SlaActionServiceTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private TaskPenaltyService taskPenaltyService;

    @Mock
    private SlaActionLogRepository slaActionLogRepository;

    @Mock
    private TaskSlaStateRepository taskSlaStateRepository;

    private Clock fixedClock;
    private SlaActionService slaActionService;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-06-17T10:00:00Z"), ZoneId.of("UTC"));
        slaActionService = new SlaActionService(
                notificationService,
                taskPenaltyService,
                slaActionLogRepository,
                taskSlaStateRepository,
                fixedClock
        );
    }

    @Test
    @DisplayName("Should push notification for DUE_TODAY once and skip if duplicate")
    void testDueTodayNotification() {
        UserAccount assignee = UserAccount.builder().id(12L).username("testUser").build();
        Project project = Project.builder().id(1L).build();
        Task task = Task.builder()
                .id(100L)
                .project(project)
                .status(TaskStatus.IN_PROGRESS)
                .primaryAssignee(assignee)
                .build();

        TaskSlaEvaluation evaluation = new TaskSlaEvaluation(
                EnumSet.of(TaskSlaCategory.DUE_TODAY),
                0,
                false
        );

        // Case 1: First time - no duplicate action log exists
        when(slaActionLogRepository.existsByActionKey(anyString())).thenReturn(false);

        String result = slaActionService.executeActions(task, evaluation);
        assertThat(result).contains("NOTIFIED_ASSIGNEE");
        verify(notificationService, times(1)).createAndPush(any(), any(), any(), any(), any(), any(), any());
        verify(slaActionLogRepository, times(1)).save(any());

        // Case 2: Duplicate call - log exists
        reset(notificationService, slaActionLogRepository);
        when(slaActionLogRepository.existsByActionKey(anyString())).thenReturn(true);

        String resultDuplicate = slaActionService.executeActions(task, evaluation);
        assertThat(resultDuplicate).contains("SKIPPED_DUPLICATE_NOTIFICATION");
        verify(notificationService, never()).createAndPush(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should apply penalty when category has OVERDUE_PENALTY")
    void testApplyPenalty() {
        UserAccount assignee = UserAccount.builder().id(12L).username("testUser").build();
        Project project = Project.builder().id(1L).build();
        Task task = Task.builder()
                .id(100L)
                .project(project)
                .status(TaskStatus.IN_PROGRESS)
                .primaryAssignee(assignee)
                .overduePenaltyApplied(false)
                .build();

        TaskSlaEvaluation evaluation = new TaskSlaEvaluation(
                EnumSet.of(TaskSlaCategory.OVERDUE_PENALTY),
                3,
                false
        );

        when(slaActionLogRepository.existsByActionKey(anyString())).thenReturn(false);

        String result = slaActionService.executeActions(task, evaluation);
        assertThat(result).contains("APPLIED_PENALTY");
        verify(taskPenaltyService, times(1)).applyPenaltyIfNeeded(task, evaluation);
    }
}
