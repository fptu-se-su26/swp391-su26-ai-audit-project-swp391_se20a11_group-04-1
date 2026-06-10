package org.example.backend.service.digest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.repository.DailyDigestRepository;
import org.example.backend.repository.EmailLogRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.EmailService;
import org.example.backend.service.event.OutboxEventService;
import org.example.backend.service.sla.TaskSlaCategory;
import org.example.backend.service.sla.TaskSlaEvaluation;
import org.example.backend.service.sla.TaskSlaRuleService;
import org.example.backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyDigestService {

    private static final String DIGEST_TYPE = "DAILY_MEMBER_DIGEST";

    private final TaskRepository taskRepository;
    private final DailyDigestRepository dailyDigestRepository;
    private final EmailLogRepository emailLogRepository;
    private final TaskSlaRuleService taskSlaRuleService;
    private final EmailService emailService;
    private final OutboxEventService outboxEventService;
    private final ProjectRepository projectRepository;
    private final Clock clock;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String baseUrl;

    @Transactional
    public int buildDailyDigests() {
        List<Project> activeProjects = projectRepository.findAll().stream()
                .filter(p -> p.getStatus() == ProjectStatus.ACTIVE)
                .collect(Collectors.toList());
        int total = 0;
        for (Project project : activeProjects) {
            total += buildDailyDigestsForProject(project.getId());
        }
        return total;
    }

    @Transactional
    public int buildDailyDigestsForProject(Long projectId) {
        LocalDate today = LocalDate.now(clock);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Map<UserAccount, List<Task>> tasksByUser = taskRepository.findSlaCandidatesByProjectId(projectId).stream()
                .filter(task -> task.getPrimaryAssignee() != null)
                .collect(Collectors.groupingBy(Task::getPrimaryAssignee));

        int created = 0;
        for (Map.Entry<UserAccount, List<Task>> entry : tasksByUser.entrySet()) {
            UserAccount user = entry.getKey();
            if (dailyDigestRepository.existsByUserIdAndProjectIdAndDigestDateAndDigestType(user.getId(), projectId, today, DIGEST_TYPE)) {
                continue;
            }

            DailyDigest digest = DailyDigest.builder()
                    .user(user)
                    .project(project)
                    .digestDate(today)
                    .digestType(DIGEST_TYPE)
                    .build();

            entry.getValue().stream()
                    .sorted(Comparator.comparing(Task::getDeadline, Comparator.nullsLast(Comparator.naturalOrder())))
                    .forEach(task -> addDigestItems(digest, task, today));

            if (digest.getItems().isEmpty()) {
                continue;
            }

            DailyDigest saved = dailyDigestRepository.save(digest);
            outboxEventService.createEvent("DAILY_DIGEST_BUILT", "DailyDigest", saved.getId(), Map.of(
                    "digestId", saved.getId(),
                    "userId", user.getId(),
                    "projectId", projectId,
                    "digestDate", today.toString(),
                    "itemCount", saved.getItemCount()
            ));
            created++;
        }
        log.info("Built {} daily digests for project {}", created, projectId);
        return created;
    }

    @Transactional
    public int sendPendingDailyDigestsForProject(Long projectId) {
        int sent = 0;
        for (DailyDigest digest : dailyDigestRepository.findByProjectIdAndStatusOrderByCreatedAtAsc(projectId, "PENDING")) {
            try {
                String subject = "DevTrack Daily Work Reminder - " + digest.getDigestDate();
                String body = buildEmailBody(digest);
                emailService.sendEmail(digest.getUser().getEmail(), subject, body);
                digest.setStatus("SENT");
                digest.setSentAt(LocalDateTime.now());
                emailLogRepository.save(EmailLog.builder()
                        .recipient(digest.getUser())
                        .recipientEmail(digest.getUser().getEmail())
                        .emailType(DIGEST_TYPE)
                        .subject(subject)
                        .status("SENT")
                        .relatedId(digest.getId())
                        .sentAt(LocalDateTime.now())
                        .build());
                outboxEventService.createEvent("EMAIL_DAILY_DIGEST_SENT", "DailyDigest", digest.getId(), Map.of(
                        "digestId", digest.getId(),
                        "userId", digest.getUser().getId(),
                        "email", digest.getUser().getEmail()
                ));
                sent++;
            } catch (Exception ex) {
                log.error("Failed to send digest {}", digest.getId(), ex);
                digest.setStatus("FAILED");
                digest.setLastError(ex.getMessage());
                emailLogRepository.save(EmailLog.builder()
                        .recipient(digest.getUser())
                        .recipientEmail(digest.getUser().getEmail())
                        .emailType(DIGEST_TYPE)
                        .subject("DevTrack Daily Work Reminder - " + digest.getDigestDate())
                        .status("FAILED")
                        .relatedId(digest.getId())
                        .errorMessage(ex.getMessage())
                        .build());
            }
        }
        return sent;
    }

    @Transactional
    public int sendPendingDailyDigests() {
        int sent = 0;
        for (DailyDigest digest : dailyDigestRepository.findByStatusOrderByCreatedAtAsc("PENDING")) {
            try {
                String subject = "DevTrack Daily Work Reminder - " + digest.getDigestDate();
                String body = buildEmailBody(digest);
                emailService.sendEmail(digest.getUser().getEmail(), subject, body);
                digest.setStatus("SENT");
                digest.setSentAt(LocalDateTime.now());
                emailLogRepository.save(EmailLog.builder()
                        .recipient(digest.getUser())
                        .recipientEmail(digest.getUser().getEmail())
                        .emailType(DIGEST_TYPE)
                        .subject(subject)
                        .status("SENT")
                        .relatedId(digest.getId())
                        .sentAt(LocalDateTime.now())
                        .build());
                outboxEventService.createEvent("EMAIL_DAILY_DIGEST_SENT", "DailyDigest", digest.getId(), Map.of(
                        "digestId", digest.getId(),
                        "userId", digest.getUser().getId(),
                        "email", digest.getUser().getEmail()
                ));
                sent++;
            } catch (Exception ex) {
                log.error("Failed to send digest {}", digest.getId(), ex);
                digest.setStatus("FAILED");
                digest.setLastError(ex.getMessage());
                emailLogRepository.save(EmailLog.builder()
                        .recipient(digest.getUser())
                        .recipientEmail(digest.getUser().getEmail())
                        .emailType(DIGEST_TYPE)
                        .subject("DevTrack Daily Work Reminder - " + digest.getDigestDate())
                        .status("FAILED")
                        .relatedId(digest.getId())
                        .errorMessage(ex.getMessage())
                        .build());
            }
        }
        return sent;
    }

    private void addDigestItems(DailyDigest digest, Task task, LocalDate today) {
        if (task.getStatus() == TaskStatus.DONE) {
            TaskSlaEvaluation evaluation = taskSlaRuleService.evaluate(task);
            if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
                digest.addItem(item(task, "MISSING_EVIDENCE", null, "Task is missing accepted evidence in Evidence Vault."));
            }
            return;
        }

        TaskSlaEvaluation evaluation = taskSlaRuleService.evaluate(task);
        boolean addedToMajorSection = false;

        boolean penalized = evaluation.has(TaskSlaCategory.OVERDUE_PENALTY) || task.isOverduePenaltyApplied();
        if (penalized) {
            digest.addItem(item(task, "PENALTY", "OVERDUE_PENALTY", "Task is overdue by 3+ days or missing valid evidence after deadline."));
            addedToMajorSection = true;
        } else if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) {
            digest.addItem(item(task, "OVERDUE_WARNING", null, "Task is recently overdue."));
            addedToMajorSection = true;
        }

        if (evaluation.has(TaskSlaCategory.DUE_TODAY)) {
            digest.addItem(item(task, "DUE_TODAY", null, "Deadline is today."));
            addedToMajorSection = true;
        }

        if (evaluation.has(TaskSlaCategory.DUE_TOMORROW)) {
            digest.addItem(item(task, "DUE_TOMORROW", null, "Deadline is tomorrow."));
            addedToMajorSection = true;
        }

        if (evaluation.has(TaskSlaCategory.DUE_IN_2_DAYS) || evaluation.has(TaskSlaCategory.DUE_IN_3_DAYS)) {
            digest.addItem(item(task, "UPCOMING", null, "Deadline is within next 2-3 days."));
            addedToMajorSection = true;
        }

        if (evaluation.has(TaskSlaCategory.BLOCKED)) {
            digest.addItem(item(task, "BLOCKED", null, "Task is blocked" + (task.getBlockedReason() != null ? ": " + task.getBlockedReason() : ".")));
            addedToMajorSection = true;
        }

        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            digest.addItem(item(task, "MISSING_EVIDENCE", null, "Task is missing accepted evidence in Evidence Vault."));
            addedToMajorSection = true;
        }

        if (!addedToMajorSection && task.getSprintPlanDate() != null && task.getSprintPlanDate().equals(today)) {
            digest.addItem(item(task, "PLANNED_TODAY", null, "Task is planned to work on today."));
        }
    }

    private DailyDigestItem item(Task task, String category, String penaltyLabel, String note) {
        return DailyDigestItem.builder()
                .task(task)
                .category(category)
                .title(task.getTitle())
                .deadline(task.getDeadline())
                .penaltyLabel(penaltyLabel)
                .note(note)
                .build();
    }

    private String buildEmailBody(DailyDigest digest) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='utf-8'><style>");
        html.append("body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; color: #333333; margin: 0; padding: 0; }");
        html.append(".email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e1e8ed; }");
        html.append(".email-header { background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 30px; text-align: center; color: #ffffff; }");
        html.append(".email-header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }");
        html.append(".email-header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }");
        html.append(".email-body { padding: 30px 35px; line-height: 1.6; }");
        html.append(".card { border-radius: 8px; padding: 15px; margin-bottom: 20px; border-left: 5px solid; background-color: #f8fafc; }");
        html.append(".card-title { font-size: 16px; font-weight: 700; margin-top: 0; margin-bottom: 10px; }");
        html.append(".task-item { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }");
        html.append(".task-item:last-child { border-bottom: none; padding-bottom: 0; }");
        html.append(".task-title { font-weight: 600; color: #1e293b; font-size: 15px; margin: 0 0 5px 0; }");
        html.append(".task-meta { font-size: 13px; color: #64748b; margin: 0 0 8px 0; }");
        html.append(".task-note { font-size: 13px; color: #475569; margin: 0 0 10px 0; font-style: italic; }");
        html.append(".btn-link { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; transition: background-color 0.2s; }");
        html.append(".email-footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }");
        html.append("</style></head><body>");

        html.append("<div class='email-container'>");
        html.append("<div class='email-header'>");
        html.append("<h1>DevTrack AI - ").append(escape(digest.getProject().getName())).append("</h1>");
        html.append("<p>Daily Work Reminder - ").append(digest.getDigestDate()).append("</p>");
        html.append("</div>");

        html.append("<div class='email-body'>");
        html.append("<p>Hello <strong>").append(escape(digest.getUser().getUsername())).append("</strong>,</p>");
        html.append("<p>Here is your daily digest of actionable tasks for project <strong>").append(escape(digest.getProject().getName())).append("</strong>. Please review the items below and prioritize your work accordingly.</p>");

        appendSection(html, digest, "PENALTY", "Penalty / Critical", "#ef4444", "#fef2f2");
        appendSection(html, digest, "OVERDUE_WARNING", "Overdue Warning", "#f97316", "#fff7ed");
        appendSection(html, digest, "DUE_TODAY", "Due Today", "#eab308", "#fefce8");
        appendSection(html, digest, "DUE_TOMORROW", "Due Tomorrow", "#3b82f6", "#eff6ff");
        appendSection(html, digest, "UPCOMING", "Upcoming", "#0ea5e9", "#f0f9ff");
        appendSection(html, digest, "BLOCKED", "Blocked", "#8b5cf6", "#f5f3ff");
        appendSection(html, digest, "MISSING_EVIDENCE", "Missing Evidence", "#d946ef", "#fdf4ff");
        appendSection(html, digest, "PLANNED_TODAY", "Planned Today", "#10b981", "#ecfdf5");

        html.append("</div>");
        html.append("<div class='email-footer'>");
        html.append("<p>This is an automated reminder from DevTrack AI. To view your full dashboard, log in to the system.</p>");
        html.append("<p>&copy; 2026 DevTrack AI Team. All rights reserved.</p>");
        html.append("</div></div></body></html>");

        return html.toString();
    }

    private void appendSection(StringBuilder html, DailyDigest digest, String category, String title, String borderColor, String bgColor) {
        List<DailyDigestItem> items = digest.getItems().stream()
                .filter(item -> category.equals(item.getCategory()))
                .toList();
        if (items.isEmpty()) {
            return;
        }

        html.append("<div class='card' style='border-color: ").append(borderColor).append("; background-color: ").append(bgColor).append(";'>");
        html.append("<h3 class='card-title' style='color: ").append(borderColor).append(";'>").append(title).append(" (").append(items.size()).append(")</h3>");

        for (DailyDigestItem item : items) {
            String taskUrl = baseUrl + "/projects/" + item.getTask().getProject().getId() + "/tasks/" + item.getTask().getId();

            html.append("<div class='task-item'>");
            html.append("<p class='task-title'>").append(escape(item.getTitle())).append("</p>");
            html.append("<p class='task-meta'>Deadline: ").append(item.getDeadline() != null ? item.getDeadline() : "N/A").append(" | Status: ").append(item.getTask().getStatus()).append("</p>");
            if (item.getNote() != null && !item.getNote().isEmpty()) {
                html.append("<p class='task-note'>").append(escape(item.getNote())).append("</p>");
            }
            html.append("<a href='").append(taskUrl).append("' class='btn-link'>Xem task</a>");
            html.append("</div>");
        }
        html.append("</div>");
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
