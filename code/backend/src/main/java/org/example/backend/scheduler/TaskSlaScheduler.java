package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.SchedulerRunLog;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.WeeklyReportService;
import org.example.backend.service.digest.DailyDigestService;
import org.example.backend.service.event.OutboxPublisherService;
import org.example.backend.service.scheduler.SchedulerRunLogService;
import org.example.backend.service.sla.TaskPenaltyService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskSlaScheduler {

    private final TaskRepository taskRepository;
    private final TaskPenaltyService taskPenaltyService;
    private final DailyDigestService dailyDigestService;
    private final WeeklyReportService weeklyReportService;
    private final OutboxPublisherService outboxPublisherService;
    private final SchedulerRunLogService schedulerRunLogService;

    @Scheduled(cron = "0 45 7 * * *", zone = "Asia/Ho_Chi_Minh")
    public void scanSlaAndApplyPenalties() {
        SchedulerRunLog runLog = schedulerRunLogService.start("TASK_SLA_SCAN");
        try {
            int scanned = taskRepository.findAllSlaCandidates().size();
            int penalties = taskPenaltyService.applyOverduePenalties();
            schedulerRunLogService.finish(runLog, scanned, penalties, 0);
        } catch (Exception ex) {
            log.error("TASK_SLA_SCAN failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    @Scheduled(cron = "0 55 7 * * *", zone = "Asia/Ho_Chi_Minh")
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

    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
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

    @Scheduled(cron = "0 0 20 * * SUN", zone = "Asia/Ho_Chi_Minh")
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

    @Scheduled(fixedDelayString = "${app.events.outbox-publish-delay-ms:30000}")
    public void publishOutboxEvents() {
        try {
            outboxPublisherService.publishPendingEvents();
        } catch (Exception ex) {
            log.error("OUTBOX_PUBLISH failed", ex);
        }
    }
}
