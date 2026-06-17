package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.TaskSlaPauseSummaryResponse;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskSlaPauseLog;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskSlaPauseLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskSlaPauseService {

    private final TaskRepository taskRepository;
    private final TaskSlaPauseLogRepository taskSlaPauseLogRepository;
    private final Clock clock;

    @Transactional
    public void openPauseIfNeeded(Task task, String reason) {
        Optional<TaskSlaPauseLog> openLog = taskSlaPauseLogRepository
                .findFirstByTaskIdAndResumedAtIsNullOrderByPausedAtDesc(task.getId());
        if (openLog.isPresent()) {
            log.info("Task {} already has an open pause log, skipping creation", task.getId());
            return;
        }
        String logReason = (reason == null || reason.trim().isEmpty()) ? "Task blocked" : reason.trim();
        TaskSlaPauseLog newLog = TaskSlaPauseLog.builder()
                .task(task)
                .pausedAt(LocalDateTime.now(clock))
                .reason(logReason)
                .build();
        taskSlaPauseLogRepository.save(newLog);
        log.info("Opened SLA pause log for Task {} with reason: {}", task.getId(), logReason);
    }

    @Transactional
    public void resumeOpenPauseIfNeeded(Task task) {
        Optional<TaskSlaPauseLog> openLog = taskSlaPauseLogRepository
                .findFirstByTaskIdAndResumedAtIsNullOrderByPausedAtDesc(task.getId());
        if (openLog.isEmpty()) {
            log.info("No open pause log found for Task {}, skipping resume", task.getId());
            return;
        }
        TaskSlaPauseLog logItem = openLog.get();
        logItem.setResumedAt(LocalDateTime.now(clock));
        taskSlaPauseLogRepository.save(logItem);
        log.info("Closed SLA pause log for Task {}, resumed at {}", task.getId(), logItem.getResumedAt());
    }

    public Duration calculatePausedDurationAfterDeadline(Task task, LocalDateTime now) {
        if (task.getDeadline() == null) {
            return Duration.ZERO;
        }
        LocalDateTime deadlineStart = task.getDeadline().atStartOfDay();
        List<TaskSlaPauseLog> logs = taskSlaPauseLogRepository.findByTaskIdOrderByPausedAtDesc(task.getId());
        Duration total = Duration.ZERO;
        for (TaskSlaPauseLog logItem : logs) {
            LocalDateTime pausedAt = logItem.getPausedAt();
            LocalDateTime resumedAt = logItem.getResumedAt() != null ? logItem.getResumedAt() : now;

            if (resumedAt.isBefore(pausedAt)) {
                continue;
            }

            // We only care about the overlap of [pausedAt, resumedAt] with [deadlineStart, now]
            LocalDateTime start = pausedAt.isAfter(deadlineStart) ? pausedAt : deadlineStart;
            LocalDateTime end = resumedAt.isAfter(deadlineStart) ? resumedAt : deadlineStart;

            if (end.isAfter(start)) {
                total = total.plus(Duration.between(start, end));
            }
        }
        return total;
    }

    public long calculateEffectiveOverdueDays(Task task, LocalDate today) {
        if (task.getDeadline() == null || !today.isAfter(task.getDeadline())) {
            return 0;
        }
        long rawOverdueDays = java.time.temporal.ChronoUnit.DAYS.between(task.getDeadline(), today);

        LocalDateTime now = LocalDateTime.now(clock);
        if (now.toLocalDate().isBefore(today)) {
            now = today.atStartOfDay();
        } else if (now.toLocalDate().isAfter(today)) {
            now = today.atTime(23, 59, 59);
        }

        Duration pausedDuration = calculatePausedDurationAfterDeadline(task, now);
        long pausedDays = pausedDuration.toDays();

        return Math.max(0, rawOverdueDays - pausedDays);
    }

    @Transactional(readOnly = true)
    public TaskSlaPauseSummaryResponse getPauseSummary(Long projectId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));
        if (!task.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Task ID " + taskId + " does not belong to Project ID " + projectId);
        }

        List<TaskSlaPauseLog> logs = taskSlaPauseLogRepository.findByTaskIdOrderByPausedAtDesc(taskId);

        LocalDateTime now = LocalDateTime.now(clock);
        long totalPausedMinutes = 0;
        boolean currentlyPaused = false;
        LocalDateTime currentPauseStartedAt = null;

        for (TaskSlaPauseLog logItem : logs) {
            LocalDateTime start = logItem.getPausedAt();
            LocalDateTime end = logItem.getResumedAt();
            if (end == null) {
                currentlyPaused = true;
                currentPauseStartedAt = start;
                end = now;
            }
            if (end.isAfter(start)) {
                totalPausedMinutes += Duration.between(start, end).toMinutes();
            }
        }

        List<TaskSlaPauseSummaryResponse.PauseLogItem> logItems = logs.stream()
                .map(logItem -> TaskSlaPauseSummaryResponse.PauseLogItem.builder()
                        .id(logItem.getId())
                        .pausedAt(logItem.getPausedAt())
                        .resumedAt(logItem.getResumedAt())
                        .reason(logItem.getReason())
                        .build())
                .collect(Collectors.toList());

        return TaskSlaPauseSummaryResponse.builder()
                .taskId(taskId)
                .projectId(projectId)
                .totalPausedMinutes(totalPausedMinutes)
                .currentlyPaused(currentlyPaused)
                .currentPauseStartedAt(currentPauseStartedAt)
                .logs(logItems)
                .build();
    }
}
