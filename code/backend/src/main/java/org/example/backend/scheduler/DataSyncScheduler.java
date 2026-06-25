package org.example.backend.scheduler;

import org.example.backend.annotation.MonitoredJob;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.constant.SyncTriggerType;
import org.example.backend.dto.event.SyncEvent;
import org.example.backend.entity.EntitySyncLog;
import org.example.backend.entity.SchedulerRunLog;
import org.example.backend.entity.Sprint;
import org.example.backend.entity.SprintStatus;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskSlaState;
import org.example.backend.entity.TaskStatus;
import org.example.backend.repository.EntitySyncLogRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.example.backend.service.scheduler.SchedulerRunLogService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSyncScheduler {

    private final SprintRepository sprintRepository;
    private final EntitySyncLogRepository entitySyncLogRepository;
    private final TaskSlaStateRepository taskSlaStateRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final SchedulerRunLogService schedulerRunLogService;

    @Scheduled(fixedDelay = 900000) // 15 minutes
    @Transactional
    @MonitoredJob(name="DataSyncScheduler")
    public void detectAndFixStaleData() {
        SchedulerRunLog runLog = schedulerRunLogService.start("DataSyncScheduler");
        int sprintsFixed = 0;
        int syncsRetried = 0;

        try {
            // Bước 1 — Sprint stale: chỉ load sprint ACTIVE đã hết hạn
            LocalDate today = LocalDate.now();
            List<Sprint> staleSprints = sprintRepository.findActiveSprintsEndedBefore(SprintStatus.ACTIVE, today);
            for (Sprint sprint : staleSprints) {
                sprint.setStatus(SprintStatus.COMPLETED);
                sprintRepository.save(sprint);
                eventPublisher.publishEvent(new SyncEvent(this,
                        SyncTriggerType.SPRINT_STATUS_CHANGED,
                        "Sprint",
                        sprint.getId(),
                        Map.of("projectId", sprint.getProject().getId())
                ));
                backfillPredictionAccurate(sprint, today);
                sprintsFixed++;
            }

            // Bước 2 — Retry failed syncs
            LocalDateTime now = LocalDateTime.now();
            List<EntitySyncLog> pendingLogs = entitySyncLogRepository.findRetryPending(now);
            for (EntitySyncLog syncLog : pendingLogs) {
                if (syncLog.getRetryCount() >= 3) {
                    syncLog.setStatus("DEAD");
                    entitySyncLogRepository.save(syncLog);
                } else {
                    syncLog.setRetryCount(syncLog.getRetryCount() + 1);
                    entitySyncLogRepository.save(syncLog);
                    eventPublisher.publishEvent(new SyncEvent(this,
                            SyncTriggerType.valueOf(syncLog.getTriggerType()),
                            syncLog.getEntityType(),
                            syncLog.getEntityId(),
                            Map.of()
                    ));
                    syncsRetried++;
                }
            }

            schedulerRunLogService.finish(runLog, sprintsFixed + syncsRetried, sprintsFixed, syncsRetried);
            log.info("DataSyncScheduler completed: {} sprints fixed, {} syncs retried", sprintsFixed, syncsRetried);
        } catch (Exception e) {
            log.error("DataSyncScheduler failed", e);
            schedulerRunLogService.fail(runLog, e);
        }
    }

    private void backfillPredictionAccurate(Sprint sprint, LocalDate today) {
        List<TaskSlaState> states = taskSlaStateRepository
                .findByProjectIdAndSprintIdWithTask(sprint.getProject().getId(), sprint.getId());
        for (TaskSlaState state : states) {
            if (state.getPredictedRiskLevel() == null || state.getPredictionAccurate() != null) {
                continue;
            }
            Task task = state.getTask();
            boolean actuallyRisky;
            if (task.getStatus() == TaskStatus.DONE) {
                actuallyRisky = false;
            } else if (task.getDeadline() != null && today.isAfter(task.getDeadline())) {
                actuallyRisky = true;
            } else {
                continue; // cannot determine — skip
            }
            boolean predictedRisky = "HIGH".equals(state.getPredictedRiskLevel())
                    || "CRITICAL".equals(state.getPredictedRiskLevel());
            state.setPredictionAccurate(predictedRisky == actuallyRisky);
            taskSlaStateRepository.save(state);
        }
    }
}
