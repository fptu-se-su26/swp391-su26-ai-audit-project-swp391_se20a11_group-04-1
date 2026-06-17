package org.example.backend.service.sla;

import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.example.backend.repository.EvidenceLinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskSlaRuleService — Unit Tests")
class TaskSlaRuleServiceTest {

    @Mock
    private EvidenceLinkRepository evidenceLinkRepository;

    @Mock
    private TaskSlaPauseService taskSlaPauseService;

    private Clock fixedClock;
    private TaskSlaRuleService taskSlaRuleService;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-06-17T10:00:00Z"), ZoneId.of("UTC"));
        taskSlaRuleService = new TaskSlaRuleService(evidenceLinkRepository, taskSlaPauseService, fixedClock);

        // Default stub for calculateEffectiveOverdueDays to match unpaused behavior
        when(taskSlaPauseService.calculateEffectiveOverdueDays(any(), any()))
                .thenAnswer(invocation -> {
                    Task t = invocation.getArgument(0);
                    LocalDate d = invocation.getArgument(1);
                    if (t.getDeadline() == null || !d.isAfter(t.getDeadline())) {
                        return 0L;
                    }
                    return java.time.temporal.ChronoUnit.DAYS.between(t.getDeadline(), d);
                });
    }

    @Test
    @DisplayName("Should evaluate as DUE_TODAY if deadline is today")
    void testDueToday() {
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .deadline(LocalDate.of(2026, 6, 17))
                .build();

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.has(TaskSlaCategory.DUE_TODAY)).isTrue();
        assertThat(eval.has(TaskSlaCategory.DUE_SOON)).isTrue();
        assertThat(eval.overdueDays()).isEqualTo(0);
    }

    @Test
    @DisplayName("Should evaluate as DUE_TOMORROW if deadline is tomorrow")
    void testDueTomorrow() {
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .deadline(LocalDate.of(2026, 6, 18))
                .build();

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.has(TaskSlaCategory.DUE_TOMORROW)).isTrue();
        assertThat(eval.has(TaskSlaCategory.DUE_SOON)).isTrue();
        assertThat(eval.overdueDays()).isEqualTo(0);
    }

    @Test
    @DisplayName("Should evaluate as OVERDUE_SHORT if overdue by 1-2 days")
    void testOverdueShort() {
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .deadline(LocalDate.of(2026, 6, 16)) // 1 day overdue on 2026-06-17
                .build();

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.has(TaskSlaCategory.OVERDUE_SHORT)).isTrue();
        assertThat(eval.has(TaskSlaCategory.OVERDUE_PENALTY)).isFalse();
        assertThat(eval.overdueDays()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should evaluate as OVERDUE_PENALTY if overdue by 3+ days")
    void testOverduePenalty() {
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.IN_PROGRESS)
                .deadline(LocalDate.of(2026, 6, 14)) // 3 days overdue on 2026-06-17
                .build();

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.has(TaskSlaCategory.OVERDUE_PENALTY)).isTrue();
        assertThat(eval.overdueDays()).isEqualTo(3);
    }

    @Test
    @DisplayName("Should evaluate as BLOCKED if task status is BLOCKED")
    void testBlocked() {
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.BLOCKED)
                .build();

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.has(TaskSlaCategory.BLOCKED)).isTrue();
    }

    @Test
    @DisplayName("Should evaluate as MISSING_EVIDENCE if DONE but has no accepted evidence")
    void testMissingEvidence() {
        Task task = Task.builder()
                .id(1L)
                .status(TaskStatus.DONE)
                .build();

        // Stub evidence repository to return false
        when(evidenceLinkRepository.existsAcceptedEvidenceForEntity(any(), any(), any()))
                .thenReturn(false);

        TaskSlaEvaluation eval = taskSlaRuleService.evaluate(task);
        assertThat(eval.has(TaskSlaCategory.MISSING_EVIDENCE)).isTrue();
    }
}
