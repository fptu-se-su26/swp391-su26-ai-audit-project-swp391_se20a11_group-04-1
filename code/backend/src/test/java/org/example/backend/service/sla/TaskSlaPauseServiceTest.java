package org.example.backend.service.sla;

import org.example.backend.dto.TaskSlaPauseSummaryResponse;
import org.example.backend.entity.Project;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskSlaPauseLog;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskSlaPauseLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskSlaPauseService — Unit Tests")
class TaskSlaPauseServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TaskSlaPauseLogRepository taskSlaPauseLogRepository;

    private Clock fixedClock;
    private TaskSlaPauseService taskSlaPauseService;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-06-17T12:00:00Z"), ZoneId.of("UTC"));
        taskSlaPauseService = new TaskSlaPauseService(taskRepository, taskSlaPauseLogRepository, fixedClock);
    }

    @Test
    @DisplayName("openPauseIfNeeded — should create new log if none exists")
    void testOpenPauseNewLog() {
        Task task = Task.builder().id(1L).build();
        when(taskSlaPauseLogRepository.findFirstByTaskIdAndResumedAtIsNullOrderByPausedAtDesc(1L))
                .thenReturn(Optional.empty());

        taskSlaPauseService.openPauseIfNeeded(task, "Waiting for assets");

        ArgumentCaptor<TaskSlaPauseLog> captor = ArgumentCaptor.forClass(TaskSlaPauseLog.class);
        verify(taskSlaPauseLogRepository).save(captor.capture());
        
        TaskSlaPauseLog saved = captor.getValue();
        assertThat(saved.getTask()).isEqualTo(task);
        assertThat(saved.getPausedAt()).isEqualTo(LocalDateTime.now(fixedClock));
        assertThat(saved.getReason()).isEqualTo("Waiting for assets");
        assertThat(saved.getResumedAt()).isNull();
    }

    @Test
    @DisplayName("openPauseIfNeeded — should fallback to default reason if blank")
    void testOpenPauseBlankReason() {
        Task task = Task.builder().id(1L).build();
        when(taskSlaPauseLogRepository.findFirstByTaskIdAndResumedAtIsNullOrderByPausedAtDesc(1L))
                .thenReturn(Optional.empty());

        taskSlaPauseService.openPauseIfNeeded(task, "   ");

        ArgumentCaptor<TaskSlaPauseLog> captor = ArgumentCaptor.forClass(TaskSlaPauseLog.class);
        verify(taskSlaPauseLogRepository).save(captor.capture());
        
        TaskSlaPauseLog saved = captor.getValue();
        assertThat(saved.getReason()).isEqualTo("Task blocked");
    }

    @Test
    @DisplayName("openPauseIfNeeded — should not create log if one is already open")
    void testOpenPauseAlreadyOpen() {
        Task task = Task.builder().id(1L).build();
        TaskSlaPauseLog openLog = new TaskSlaPauseLog();
        when(taskSlaPauseLogRepository.findFirstByTaskIdAndResumedAtIsNullOrderByPausedAtDesc(1L))
                .thenReturn(Optional.of(openLog));

        taskSlaPauseService.openPauseIfNeeded(task, "Reason");

        verify(taskSlaPauseLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("resumeOpenPauseIfNeeded — should close open log")
    void testResumeOpenPause() {
        Task task = Task.builder().id(1L).build();
        TaskSlaPauseLog openLog = TaskSlaPauseLog.builder()
                .id(10L)
                .task(task)
                .pausedAt(LocalDateTime.now(fixedClock).minusHours(2))
                .build();
        when(taskSlaPauseLogRepository.findFirstByTaskIdAndResumedAtIsNullOrderByPausedAtDesc(1L))
                .thenReturn(Optional.of(openLog));

        taskSlaPauseService.resumeOpenPauseIfNeeded(task);

        verify(taskSlaPauseLogRepository).save(openLog);
        assertThat(openLog.getResumedAt()).isEqualTo(LocalDateTime.now(fixedClock));
    }

    @Test
    @DisplayName("resumeOpenPauseIfNeeded — should do nothing if no log open")
    void testResumeNoOpenLog() {
        Task task = Task.builder().id(1L).build();
        when(taskSlaPauseLogRepository.findFirstByTaskIdAndResumedAtIsNullOrderByPausedAtDesc(1L))
                .thenReturn(Optional.empty());

        taskSlaPauseService.resumeOpenPauseIfNeeded(task);

        verify(taskSlaPauseLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("calculatePausedDurationAfterDeadline — should return zero if no deadline")
    void testCalcDurationNoDeadline() {
        Task task = Task.builder().id(1L).deadline(null).build();
        Duration dur = taskSlaPauseService.calculatePausedDurationAfterDeadline(task, LocalDateTime.now(fixedClock));
        assertThat(dur).isEqualTo(Duration.ZERO);
    }

    @Test
    @DisplayName("calculatePausedDurationAfterDeadline — correct overlap calculation")
    void testCalcDurationOverlap() {
        LocalDate deadline = LocalDate.of(2026, 6, 16);
        Task task = Task.builder().id(1L).deadline(deadline).build();

        LocalDateTime deadlineStart = deadline.atStartOfDay();

        TaskSlaPauseLog pauseBefore = TaskSlaPauseLog.builder()
                .pausedAt(deadlineStart.minusDays(1).plusHours(10))
                .resumedAt(deadlineStart.minusDays(1).plusHours(12))
                .build();

        TaskSlaPauseLog pauseOverlap = TaskSlaPauseLog.builder()
                .pausedAt(deadlineStart.minusHours(2))
                .resumedAt(deadlineStart.plusHours(2))
                .build();

        TaskSlaPauseLog pauseAfter = TaskSlaPauseLog.builder()
                .pausedAt(deadlineStart.plusHours(10))
                .resumedAt(deadlineStart.plusHours(15))
                .build();

        TaskSlaPauseLog pauseOpen = TaskSlaPauseLog.builder()
                .pausedAt(LocalDateTime.now(fixedClock).minusHours(2))
                .resumedAt(null)
                .build();

        when(taskSlaPauseLogRepository.findByTaskIdOrderByPausedAtDesc(1L))
                .thenReturn(Arrays.asList(pauseBefore, pauseOverlap, pauseAfter, pauseOpen));

        Duration dur = taskSlaPauseService.calculatePausedDurationAfterDeadline(task, LocalDateTime.now(fixedClock));
        assertThat(dur).isEqualTo(Duration.ofHours(9));
    }

    @Test
    @DisplayName("calculateEffectiveOverdueDays — correct calculation")
    void testCalculateEffectiveOverdueDays() {
        LocalDate deadline = LocalDate.of(2026, 6, 10);
        LocalDate today = LocalDate.of(2026, 6, 15);
        Task task = Task.builder().id(1L).deadline(deadline).build();

        TaskSlaPauseLog pause = TaskSlaPauseLog.builder()
                .pausedAt(deadline.atStartOfDay().plusDays(1))
                .resumedAt(deadline.atStartOfDay().plusDays(3))
                .build();

        when(taskSlaPauseLogRepository.findByTaskIdOrderByPausedAtDesc(1L))
                .thenReturn(Collections.singletonList(pause));

        long effective = taskSlaPauseService.calculateEffectiveOverdueDays(task, today);
        assertThat(effective).isEqualTo(3); // 5 days raw - 2 days pause
    }

    @Test
    @DisplayName("getPauseSummary — should build response correctly")
    void testGetPauseSummary() {
        Project project = Project.builder().id(100L).build();
        Task task = Task.builder().id(1L).project(project).build();

        TaskSlaPauseLog log1 = TaskSlaPauseLog.builder()
                .id(50L)
                .pausedAt(LocalDateTime.now(fixedClock).minusHours(3))
                .resumedAt(LocalDateTime.now(fixedClock).minusHours(1))
                .reason("Blocked")
                .build();

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(taskSlaPauseLogRepository.findByTaskIdOrderByPausedAtDesc(1L))
                .thenReturn(Collections.singletonList(log1));

        TaskSlaPauseSummaryResponse summary = taskSlaPauseService.getPauseSummary(100L, 1L);
        assertThat(summary.getTaskId()).isEqualTo(1L);
        assertThat(summary.getProjectId()).isEqualTo(100L);
        assertThat(summary.getTotalPausedMinutes()).isEqualTo(120);
        assertThat(summary.isCurrentlyPaused()).isFalse();
        assertThat(summary.getLogs()).hasSize(1);
    }
}
