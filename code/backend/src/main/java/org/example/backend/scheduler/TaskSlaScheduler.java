package org.example.backend.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.NotificationEntityType;
import org.example.backend.entity.NotificationType;
import org.example.backend.entity.SchedulerRunLog;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.example.backend.entity.Project;
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
import org.example.backend.service.sla.TaskPenaltyService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskSlaScheduler {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final TaskPenaltyService taskPenaltyService;
    private final DailyDigestService dailyDigestService;
    private final WeeklyReportService weeklyReportService;
    private final OutboxPublisherService outboxPublisherService;
    private final OutboxEventService outboxEventService;
    private final SchedulerRunLogService schedulerRunLogService;
    private final TaskService taskService;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final Clock clock;

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

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Ho_Chi_Minh")
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

    @Scheduled(cron = "0 30 7 * * *", zone = "Asia/Ho_Chi_Minh")
    public void publishDailySlaRecheckEvents() {
        SchedulerRunLog runLog = schedulerRunLogService.start("DAILY_SLA_RECHECK_PUBLISH");
        try {
            int scanned = 0;
            int published = 0;
            List<Project> activeProjects = projectRepository.findAll().stream()
                    .filter(p -> p.getStatus() == ProjectStatus.ACTIVE)
                    .collect(Collectors.toList());
            for (Project project : activeProjects) {
                List<Task> tasks = taskRepository.findSlaCandidatesByProjectId(project.getId());
                for (Task task : tasks) {
                    if (task.getStatus() != TaskStatus.DONE) {
                        scanned++;

                        Map<String, Object> payload = new HashMap<>();
                        payload.put("taskId", task.getId());
                        payload.put("projectId", task.getProject().getId());
                        payload.put("sprintId", task.getSprintId());
                        payload.put("assigneeId", task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null);
                        payload.put("deadline", task.getDeadline() != null ? task.getDeadline().toString() : null);
                        payload.put("eventType", "SLA_DAILY_RECHECK");
                        payload.put("occurredAt", LocalDateTime.now().toString());

                        outboxEventService.createEvent("SLA_DAILY_RECHECK", "Task", task.getId(), payload);
                        published++;
                    }
                }
            }
            schedulerRunLogService.finish(runLog, scanned, 0, published);
            log.info("Published SLA_DAILY_RECHECK events. Scanned: {}, Published: {}", scanned, published);
        } catch (Exception ex) {
            log.error("DAILY_SLA_RECHECK_PUBLISH failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }

    @Scheduled(cron = "0 0 17 * * *", zone = "Asia/Ho_Chi_Minh")
    public void sendAfternoonDeadlineReminder() {
        SchedulerRunLog runLog = schedulerRunLogService.start("AFTERNOON_DEADLINE_REMINDER");
        try {
            LocalDate today = LocalDate.now(clock);
            int scanned = 0;
            int sent = 0;
            List<Project> activeProjects = projectRepository.findAll().stream()
                    .filter(p -> p.getStatus() == ProjectStatus.ACTIVE)
                    .collect(Collectors.toList());
            for (Project project : activeProjects) {
                List<Task> tasks = taskRepository.findSlaCandidatesByProjectId(project.getId());
                for (Task task : tasks) {
                    if (task.getDeadline() != null 
                            && task.getDeadline().isEqual(today)
                            && task.getStatus() != TaskStatus.DONE
                            && task.getPrimaryAssignee() != null) {
                        scanned++;

                        Map<String, Object> payload = new HashMap<>();
                        payload.put("taskId", task.getId());
                        payload.put("projectId", task.getProject().getId());
                        payload.put("sprintId", task.getSprintId());
                        payload.put("assigneeId", task.getPrimaryAssignee().getId());
                        payload.put("deadline", task.getDeadline().toString());
                        payload.put("eventType", "SLA_URGENT_RECHECK");
                        payload.put("occurredAt", LocalDateTime.now().toString());

                        outboxEventService.createEvent("SLA_URGENT_RECHECK", "Task", task.getId(), payload);
                        sent++;
                    }
                }
            }
            schedulerRunLogService.finish(runLog, scanned, 0, sent);
            log.info("Published SLA_URGENT_RECHECK events. Scanned: {}, Published: {}", scanned, sent);
        } catch (Exception ex) {
            log.error("AFTERNOON_DEADLINE_REMINDER failed", ex);
            schedulerRunLogService.fail(runLog, ex);
        }
    }
}
