package org.example.backend.service.sla;

import org.example.backend.entity.Task;
import org.example.backend.entity.TaskSlaPauseLog;
import org.example.backend.entity.TaskStatus;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskSlaPauseLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskSlaRuleService — SLA Clock Pause Integration Tests")
class TaskSlaRuleServicePauseTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskSlaPauseLogRepository taskSlaPauseLogRepository;

    private Clock fixedClock;
    private TaskSlaPauseService taskSlaPauseService;
    private TaskSlaRuleService taskSlaRuleService;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-06-17T12:00:00Z"), ZoneId.of("UTC"));
        taskSlaPauseService = new TaskSlaPauseService(taskRepository, taskSlaPauseLogRepository, fixedClock);
        taskSlaRuleService = new TaskSlaRuleService(taskSlaPauseService, fixedClock);
    }

    @Test
    @DisplayName("Should calculate raw overdue when no pause log exists")
    void testNoPauseLog() {
        LocalDate deadline = LocalDate.of(2026, 6, 15);
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .deadline(deadline)
                .build();

        when(taskSlaPauseLogRepository.findByTaskIdOrderByPausedAtDesc(1L))
                .thenReturn(Collections.emptyList());

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.overdueDays()).isEqualTo(2);
        assertThat(eval.has(TaskSlaCategory.OVERDUE_SHORT)).isTrue();
        assertThat(eval.has(TaskSlaCategory.OVERDUE_PENALTY)).isFalse();
    }

    @Test
    @DisplayName("Should subtract pause days after deadline from raw overdue")
    void testWithPauseLog() {
        LocalDate deadline = LocalDate.of(2026, 6, 13);
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .deadline(deadline)
                .build();

        TaskSlaPauseLog pause = TaskSlaPauseLog.builder()
                .pausedAt(LocalDateTime.of(2026, 6, 14, 12, 0))
                .resumedAt(LocalDateTime.of(2026, 6, 16, 12, 0))
                .build();

        when(taskSlaPauseLogRepository.findByTaskIdOrderByPausedAtDesc(1L))
                .thenReturn(Collections.singletonList(pause));

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.overdueDays()).isEqualTo(2);
        assertThat(eval.has(TaskSlaCategory.OVERDUE_SHORT)).isTrue();
        assertThat(eval.has(TaskSlaCategory.OVERDUE_PENALTY)).isFalse();
    }

    @Test
    @DisplayName("Should apply penalty if effective overdue is 3+ days even after pause")
    void testOverduePenaltyAfterPause() {
        LocalDate deadline = LocalDate.of(2026, 6, 10);
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .deadline(deadline)
                .build();

        TaskSlaPauseLog pause = TaskSlaPauseLog.builder()
                .pausedAt(LocalDateTime.of(2026, 6, 11, 12, 0))
                .resumedAt(LocalDateTime.of(2026, 6, 14, 12, 0))
                .build();

        when(taskSlaPauseLogRepository.findByTaskIdOrderByPausedAtDesc(1L))
                .thenReturn(Collections.singletonList(pause));

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.overdueDays()).isEqualTo(4);
        assertThat(eval.has(TaskSlaCategory.OVERDUE_PENALTY)).isTrue();
    }

    @Test
    @DisplayName("Should count active pause log up to clock's now time")
    void testActivePauseCalculatedUpToNow() {
        LocalDate deadline = LocalDate.of(2026, 6, 15);
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.BLOCKED)
                .deadline(deadline)
                .build();

        TaskSlaPauseLog activePause = TaskSlaPauseLog.builder()
                .pausedAt(LocalDateTime.of(2026, 6, 16, 12, 0))
                .resumedAt(null)
                .build();

        when(taskSlaPauseLogRepository.findByTaskIdOrderByPausedAtDesc(1L))
                .thenReturn(Collections.singletonList(activePause));

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.overdueDays()).isEqualTo(1);
        assertThat(eval.has(TaskSlaCategory.OVERDUE_SHORT)).isTrue();
        assertThat(eval.has(TaskSlaCategory.BLOCKED)).isTrue();
    }

    @Test
    @DisplayName("Should return 0 effective overdue days if not yet past deadline")
    void testNotYetPastDeadline() {
        LocalDate deadline = LocalDate.of(2026, 6, 19);
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .deadline(deadline)
                .build();

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.overdueDays()).isEqualTo(0);
        assertThat(eval.has(TaskSlaCategory.DUE_IN_2_DAYS)).isTrue();
    }
}
