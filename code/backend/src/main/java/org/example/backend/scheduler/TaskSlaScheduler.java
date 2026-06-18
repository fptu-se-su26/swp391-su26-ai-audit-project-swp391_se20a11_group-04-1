package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.NotificationEntityType;
import org.example.backend.entity.NotificationType;
import org.example.backend.entity.SchedulerRunLog;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.example.backend.entity.ProjectStatus;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.NotificationRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.NotificationService;
import org.example.backend.service.TaskService;
import org.example.backend.service.WeeklyReportService;
import org.example.backend.service.digest.DailyDigestService;
import org.example.backend.service.event.OutboxEventService;
import org.example.backend.service.event.OutboxPublisherService;
import org.example.backend.service.scheduler.SchedulerRunLogService;
import org.example.backend.entity.Sprint;
import org.example.backend.repository.SprintRepository;
import org.example.backend.service.sla.RecoveryPlanService;
import org.example.backend.service.sla.SlaReliabilityMetricsService;
import org.example.backend.service.sla.SlaStateService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.function.Function;
import org.springframework.data.domain.Pageable;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskSlaScheduler {

    private static final int SLA_BATCH_SIZE = 100;

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final DailyDigestService dailyDigestService;
    private final WeeklyReportService weeklyReportService;
    private final OutboxPublisherService outboxPublisherService;
    private final OutboxEventService outboxEventService;
    private final SchedulerRunLogService schedulerRunLogService;
    private final TaskService taskService;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final SlaStateService slaStateService;
    private final RecoveryPlanService recoveryPlanService;
    private final SprintRepository sprintRepository;
    private final SlaReliabilityMetricsService slaReliabilityMetricsService;
    private final Clock clock;

    @EventListener(ApplicationReadyEvent.class)
    public void recheckSlaOnStartup() {
        SchedulerRunLog runLog = schedulerRunLogService.start("STARTUP_SLA_RECHECK");
        try {
            int scanned = 0;
            int evaluated = 0;
            int pageNumber = 0;
            Page<Task> page;
            do {
                page = taskRepository.findSlaRecheckCandidates(
                        ProjectStatus.ACTIVE,
                        TaskStatus.DONE,
                        PageRequest.of(pageNumber, SLA_BATCH_SIZE, Sort.by("id").ascending()));

                for (Task task : page.getContent()) {
                    scanned++;
                    slaStateService.evaluateAndPersist(task.getId(), "SLA_STARTUP_RECHECK");
                    evaluated++;
                }
                pageNumber++;
            } while (page.hasNext());

            schedulerRunLogService.finish(runLog, scanned, evaluated, 0);
            log.info("Startup SLA recheck completed. Scanned: {}, Evaluated: {}", scanned, evaluated);
        } catch (Exception ex) {
            log.error("STARTUP_SLA_RECHECK failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    @Scheduled(cron = "${app.sla.safety-net-cron:0 45 7 * * *}", zone = "${app.sla.timezone:Asia/Ho_Chi_Minh}")
    public void scanSlaAndApplyPenalties() {
        publishSlaEventsInBatches("TASK_SLA_SCAN", "SLA_SAFETY_NET",
                pageable -> taskRepository.findSlaSafetyNetCandidates(ProjectStatus.ACTIVE, TaskStatus.DONE, pageable));
    }

    @Scheduled(cron = "0 55 7 * * *", zone = "${app.sla.timezone:Asia/Ho_Chi_Minh}")
    public void buildDailyDigests() {
        SchedulerRunLog runLog = schedulerRunLogService.start("DAILY_DIGEST_BUILD");
        try {
            int scanned = taskRepository.findAllSlaCandidates().size();
            int created = dailyDigestService.buildDailyDigests();
            schedulerRunLogService.finish(runLog, scanned, created, 0);
        } catch (Exception ex) {
            log.error("DAILY_DIGEST_BUILD failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    @Scheduled(cron = "0 0 8 * * *", zone = "${app.sla.timezone:Asia/Ho_Chi_Minh}")
    public void sendDailyDigests() {
        SchedulerRunLog runLog = schedulerRunLogService.start("DAILY_DIGEST_SEND");
        try {
            int sent = dailyDigestService.sendPendingDailyDigests();
            schedulerRunLogService.finish(runLog, 0, 0, sent);
        } catch (Exception ex) {
            log.error("DAILY_DIGEST_SEND failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    @Scheduled(cron = "0 0 20 * * SUN", zone = "${app.sla.timezone:Asia/Ho_Chi_Minh}")
    public void generateWeeklyReports() {
        SchedulerRunLog runLog = schedulerRunLogService.start("WEEKLY_REPORT_GENERATE");
        try {
            int created = weeklyReportService.generateWeeklyReportsForAllProjects();
            schedulerRunLogService.finish(runLog, 0, created, 0);
        } catch (Exception ex) {
            log.error("WEEKLY_REPORT_GENERATE failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    @Scheduled(fixedDelayString = "${app.events.outbox-publish-delay-ms:3000}")
    public void publishOutboxEvents() {
        try {
            outboxPublisherService.publishPendingEvents();
        } catch (Exception ex) {
            log.error("OUTBOX_PUBLISH failed", ex);
        }
    }

    @Scheduled(cron = "0 0 * * * *", zone = "${app.sla.timezone:Asia/Ho_Chi_Minh}")
    public void autoApproveReviewTasks() {
        SchedulerRunLog runLog = schedulerRunLogService.start("AUTO_APPROVE_REVIEW_TASKS");
        try {
            taskService.autoApproveTasksExceedingReviewPeriod();
            schedulerRunLogService.finish(runLog, 0, 0, 0);
        } catch (Exception ex) {
            log.error("AUTO_APPROVE_REVIEW_TASKS failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    @Scheduled(cron = "${app.sla.daily-recheck-cron:0 30 7 * * *}", zone = "${app.sla.timezone:Asia/Ho_Chi_Minh}")
    public void publishDailySlaRecheckEvents() {
        publishSlaEventsInBatches("DAILY_SLA_RECHECK_PUBLISH", "SLA_DAILY_RECHECK",
                pageable -> taskRepository.findSlaRecheckCandidates(ProjectStatus.ACTIVE, TaskStatus.DONE, pageable));
    }

    @Scheduled(cron = "${app.sla.afternoon-reminder-cron:0 0 17 * * *}", zone = "${app.sla.timezone:Asia/Ho_Chi_Minh}")
    public void sendAfternoonDeadlineReminder() {
        LocalDate today = LocalDate.now(clock);
        publishSlaEventsInBatches("AFTERNOON_DEADLINE_REMINDER", "SLA_URGENT_RECHECK",
                pageable -> taskRepository.findAfternoonDeadlineReminderCandidates(
                        ProjectStatus.ACTIVE, today, TaskStatus.DONE, pageable));
    }

    @Scheduled(cron = "${app.sla.effectiveness-check-cron:0 0 * * * *}", zone = "${app.sla.timezone:Asia/Ho_Chi_Minh}")
    public void checkRecoveryPlanEffectiveness() {
        SchedulerRunLog runLog = schedulerRunLogService.start("RECOVERY_PLAN_EFFECTIVENESS_CHECK");
        try {
            LocalDateTime cutoff = LocalDateTime.now(clock).minusHours(24);
            int checked = recoveryPlanService.checkEffectivenessForExecutedPlans(cutoff);
            schedulerRunLogService.finish(runLog, checked, checked, 0);
        } catch (Exception ex) {
            log.error("RECOVERY_PLAN_EFFECTIVENESS_CHECK failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    // --- Private helpers ---

    private void publishSlaEventsInBatches(String jobName, String eventType,
            Function<Pageable, Page<Task>> queryFn) {
        SchedulerRunLog runLog = schedulerRunLogService.start(jobName);
        try {
            int scanned = 0, published = 0, pageNumber = 0;
            Page<Task> page;
            do {
                page = queryFn.apply(PageRequest.of(pageNumber, SLA_BATCH_SIZE, Sort.by("id").ascending()));
                for (Task task : page.getContent()) {
                    scanned++;
                    outboxEventService.createEvent(eventType, "Task", task.getId(), buildSlaPayload(task, eventType));
                    published++;
                }
                pageNumber++;
            } while (page.hasNext());
            schedulerRunLogService.finish(runLog, scanned, 0, published);
            log.info("Published {} events. Scanned: {}, Published: {}", eventType, scanned, published);
        } catch (Exception ex) {
            log.error("{} failed", jobName, ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    @Scheduled(cron = "${app.reliability.snapshot-cron:0 30 0 * * *}",
               zone = "${app.sla.timezone:Asia/Ho_Chi_Minh}")
    public void computeReliabilitySnapshotsForEndedSprints() {
        SchedulerRunLog runLog = schedulerRunLogService.start("RELIABILITY_SNAPSHOT_COMPUTE");
        try {
            LocalDate yesterday = LocalDate.now(clock).minusDays(1);
            java.util.List<Sprint> endedSprints = sprintRepository.findSprintsEndingOn(yesterday);

            int computed = 0;
            for (Sprint sprint : endedSprints) {
                try {
                    slaReliabilityMetricsService.computeAndPersist(
                            sprint.getProject().getId(), sprint.getId());
                    computed++;
                } catch (Exception ex) {
                    log.warn("Failed to compute reliability snapshot for sprint {}: {}",
                            sprint.getId(), ex.getMessage());
                }
            }
            schedulerRunLogService.finish(runLog, endedSprints.size(), computed, endedSprints.size() - computed);
            log.info("Reliability snapshots computed for {}/{} sprints ending on {}",
                    computed, endedSprints.size(), yesterday);
        } catch (Exception ex) {
            log.error("RELIABILITY_SNAPSHOT_COMPUTE failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    private Map<String, Object> buildSlaPayload(Task task, String eventType) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("taskId", task.getId());
        payload.put("projectId", task.getProject().getId());
        payload.put("sprintId", task.getSprintId());
        if (task.getPrimaryAssignee() != null) {
            payload.put("assigneeId", task.getPrimaryAssignee().getId());
        }
        if (task.getDeadline() != null) {
            payload.put("deadline", task.getDeadline().toString());
        }
        payload.put("eventType", eventType);
        payload.put("occurredAt", LocalDateTime.now(clock).toString());
        return payload;
    }
}
