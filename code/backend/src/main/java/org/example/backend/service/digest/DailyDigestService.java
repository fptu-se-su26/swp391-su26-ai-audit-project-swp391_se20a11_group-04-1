package org.example.backend.service.digest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.repository.DailyDigestRepository;
import org.example.backend.repository.EmailLogRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.EmailService;
import org.example.backend.service.event.OutboxEventService;
import org.example.backend.service.sla.TaskSlaCategory;
import org.example.backend.service.sla.TaskSlaEvaluation;
import org.example.backend.service.sla.TaskSlaRuleService;
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
    private final Clock clock;

    @Transactional
    public int buildDailyDigests() {
        LocalDate today = LocalDate.now(clock);
        Map<UserAccount, List<Task>> tasksByUser = taskRepository.findAllSlaCandidates().stream()
                .filter(task -> task.getPrimaryAssignee() != null)
                .collect(Collectors.groupingBy(Task::getPrimaryAssignee));

        int created = 0;
        for (Map.Entry<UserAccount, List<Task>> entry : tasksByUser.entrySet()) {
            UserAccount user = entry.getKey();
            if (dailyDigestRepository.existsByUserIdAndDigestDateAndDigestType(user.getId(), today, DIGEST_TYPE)) {
                continue;
            }

            DailyDigest digest = DailyDigest.builder()
                    .user(user)
                    .digestDate(today)
                    .digestType(DIGEST_TYPE)
                    .build();

            entry.getValue().stream()
                    .sorted(Comparator.comparing(Task::getDeadline, Comparator.nullsLast(Comparator.naturalOrder())))
                    .forEach(task -> addDigestItems(digest, task));

            if (digest.getItems().isEmpty()) {
                continue;
            }

            DailyDigest saved = dailyDigestRepository.save(digest);
            outboxEventService.createEvent("DAILY_DIGEST_BUILT", "DailyDigest", saved.getId(), Map.of(
                    "digestId", saved.getId(),
                    "userId", user.getId(),
                    "digestDate", today.toString(),
                    "itemCount", saved.getItemCount()
            ));
            created++;
        }
        log.info("Built {} daily digests", created);
        return created;
    }

    @Transactional
    public int sendPendingDailyDigests() {
        int sent = 0;
        for (DailyDigest digest : dailyDigestRepository.findByStatusOrderByCreatedAtAsc("PENDING")) {
            try {
                String subject = "DevTrack Daily Digest - " + digest.getDigestDate();
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
                        .subject("DevTrack Daily Digest - " + digest.getDigestDate())
                        .status("FAILED")
                        .relatedId(digest.getId())
                        .errorMessage(ex.getMessage())
                        .build());
            }
        }
        return sent;
    }

    private void addDigestItems(DailyDigest digest, Task task) {
        TaskSlaEvaluation evaluation = taskSlaRuleService.evaluate(task);
        if (evaluation.has(TaskSlaCategory.OVERDUE_FROZEN)) {
            return;
        }
        boolean penalized = evaluation.has(TaskSlaCategory.OVERDUE_PENALTY) || task.isOverduePenaltyApplied();
        if (penalized || evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) {
            digest.addItem(item(task, "OVERDUE", penalized ? "OVERDUE_PENALTY" : null,
                    penalized ? "Contribution score may be frozen or deducted." : "Task is recently overdue."));
        }
        if (evaluation.has(TaskSlaCategory.DUE_SOON)) {
            digest.addItem(item(task, "URGENT", null,
                    "Deadline is within 24 hours."));
        }
        if (evaluation.has(TaskSlaCategory.BLOCKED)) {
            digest.addItem(item(task, "ATTENTION", null,
                    "Task is blocked" + (task.getBlockedReason() != null ? ": " + task.getBlockedReason() : ".")));
        }
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            digest.addItem(item(task, "ATTENTION", null,
                    "Task is missing accepted evidence in Evidence Vault."));
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
        html.append("<h2>DevTrack Daily Digest</h2>");
        html.append("<p>Summary for ").append(digest.getDigestDate()).append("</p>");
        appendSection(html, digest, "OVERDUE", "Overdue / Penalty");
        appendSection(html, digest, "URGENT", "Urgent");
        appendSection(html, digest, "ATTENTION", "Additional attention");
        return html.toString();
    }

    private void appendSection(StringBuilder html, DailyDigest digest, String category, String title) {
        List<DailyDigestItem> items = digest.getItems().stream()
                .filter(item -> category.equals(item.getCategory()))
                .toList();
        if (items.isEmpty()) {
            return;
        }
        html.append("<h3>").append(title).append("</h3>");
        html.append("<table border='1' cellpadding='8' cellspacing='0' style='border-collapse:collapse;width:100%'>");
        html.append("<tr><th>Task</th><th>Deadline</th><th>Note</th></tr>");
        for (DailyDigestItem item : items) {
            html.append("<tr><td>").append(escape(item.getTitle())).append("</td><td>")
                    .append(item.getDeadline() != null ? item.getDeadline() : "")
                    .append("</td><td>").append(escape(item.getNote())).append("</td></tr>");
        }
        html.append("</table>");
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
