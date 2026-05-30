package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.OutboxEventActivityResponse;
import org.example.backend.dto.OutboxSummaryResponse;
import org.example.backend.dto.SchedulerEmailResponse;
import org.example.backend.dto.SchedulerRunResponse;
import org.example.backend.dto.SlaDashboardResponse;
import org.example.backend.dto.SlaFlagResponse;
import org.example.backend.dto.SlaViolationResponse;
import org.example.backend.entity.*;
import org.example.backend.entity.enums.TestCaseStatus;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.SlaDashboardService;
import org.example.backend.service.sla.TaskSlaCategory;
import org.example.backend.service.sla.TaskSlaEvaluation;
import org.example.backend.service.sla.TaskSlaRuleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SlaDashboardServiceImpl implements SlaDashboardService {

    private static final List<String> SCHEDULER_JOBS = List.of(
            "TASK_SLA_SCAN",
            "DAILY_DIGEST_BUILD",
            "DAILY_DIGEST_SEND",
            "WEEKLY_REPORT_GENERATE",
            "OUTBOX_PUBLISH"
    );

    private final TaskRepository taskRepository;
    private final TestCaseRepository testCaseRepository;
    private final EvidenceRepository evidenceRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final SchedulerRunLogRepository schedulerRunLogRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final EmailLogRepository emailLogRepository;
    private final TaskSlaRuleService taskSlaRuleService;
    private final UserAccountRepository userAccountRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public SlaDashboardResponse getProjectDashboard(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);

        List<Task> tasks = taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId);
        int totalTasks = tasks.size();
        int doneTasks = 0;
        int overdueCount = 0;
        int dueSoonCount = 0;
        int frozenTaskCount = 0;
        int penaltyCount = 0;
        int missingEvidenceCount = 0;
        long maxFrozenDays = 0;
        List<SlaViolationResponse> violations = new ArrayList<>();

        for (Task task : tasks) {
            if (task.getStatus() == TaskStatus.DONE) {
                doneTasks++;
            }

            TaskSlaEvaluation evaluation = taskSlaRuleService.evaluate(task);
            if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT) || evaluation.has(TaskSlaCategory.OVERDUE_FROZEN)) {
                overdueCount++;
            }
            if (evaluation.has(TaskSlaCategory.DUE_SOON)) {
                dueSoonCount++;
            }
            if (evaluation.has(TaskSlaCategory.OVERDUE_FROZEN)) {
                frozenTaskCount++;
                maxFrozenDays = Math.max(maxFrozenDays, evaluation.overdueDays());
            }
            if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY) || task.isOverduePenaltyApplied()) {
                penaltyCount++;
            }
            if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
                missingEvidenceCount++;
            }
            if (!evaluation.has(TaskSlaCategory.NORMAL) || task.isOverduePenaltyApplied()) {
                violations.add(toViolation(task, evaluation));
            }
        }

        long totalTests = testCaseRepository.countByProjectId(projectId);
        long passedTests = testCaseRepository.countByProjectIdAndStatus(projectId, TestCaseStatus.PASS);
        long totalEvidence = evidenceRepository.countByProjectId(projectId);
        long acceptedEvidence = evidenceRepository.countByProjectIdAndStatus(projectId, EvidenceStatus.ACCEPTED);

        return SlaDashboardResponse.builder()
                .progressPercent(percent(doneTasks, totalTasks))
                .overdueCount(overdueCount)
                .testRatePercent(percent(passedTests, totalTests))
                .evidenceRatePercent(percent(acceptedEvidence, totalEvidence))
                .missingEvidenceCount(missingEvidenceCount)
                .dueSoonCount(dueSoonCount)
                .frozenTaskCount(frozenTaskCount)
                .penaltyCount(penaltyCount)
                .flags(buildFlags(penaltyCount, frozenTaskCount, maxFrozenDays, missingEvidenceCount, dueSoonCount))
                .violations(violations)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SchedulerRunResponse> getLatestSchedulerRuns(Long userId) {
        ensureLoggedIn(userId);
        return SCHEDULER_JOBS.stream()
                .map(job -> schedulerRunLogRepository.findTopByJobNameOrderByStartedAtDesc(job)
                        .map(this::toSchedulerRunResponse)
                        .orElseGet(() -> SchedulerRunResponse.builder()
                                .jobName(job)
                                .status("NOT_RUN")
                                .totalScanned(0)
                                .totalCreated(0)
                                .totalSent(0)
                                .build()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OutboxSummaryResponse getOutboxSummary(Long userId) {
        ensureLoggedIn(userId);
        LocalDateTime todayStart = LocalDate.now(clock).atStartOfDay();
        String latestError = outboxEventRepository.findTopByStatusOrderByCreatedAtDesc("FAILED")
                .map(OutboxEvent::getLastError)
                .orElse(null);

        return OutboxSummaryResponse.builder()
                .pendingCount(outboxEventRepository.countByStatus("PENDING"))
                .failedCount(outboxEventRepository.countByStatus("FAILED"))
                .publishedTodayCount(outboxEventRepository.countByStatusAndPublishedAtAfter("PUBLISHED", todayStart))
                .latestError(latestError)
                .recentEvents(outboxEventRepository.findTop12ByOrderByCreatedAtDesc().stream()
                        .map(this::toOutboxActivity)
                        .toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SchedulerEmailResponse> getSchedulerRunEmails(String jobName, Long userId) {
        ensureLoggedIn(userId);
        SchedulerRunLog runLog = latestRunOrThrow(jobName);
        return emailLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                        runLog.getStartedAt(),
                        runLogEnd(runLog))
                .stream()
                .filter(email -> emailMatchesJob(jobName, email))
                .map(this::toSchedulerEmail)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OutboxEventActivityResponse> getSchedulerRunEvents(String jobName, Long userId) {
        ensureLoggedIn(userId);
        SchedulerRunLog runLog = latestRunOrThrow(jobName);
        return outboxEventRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                        runLog.getStartedAt(),
                        runLogEnd(runLog))
                .stream()
                .filter(event -> eventMatchesJob(jobName, event))
                .map(this::toOutboxActivity)
                .toList();
    }

    private SchedulerRunLog latestRunOrThrow(String jobName) {
        return schedulerRunLogRepository.findTopByJobNameOrderByStartedAtDesc(jobName)
                .orElseThrow(() -> new CustomException("Scheduler run not found", HttpStatus.NOT_FOUND));
    }

    private LocalDateTime runLogEnd(SchedulerRunLog runLog) {
        return runLog.getFinishedAt() != null ? runLog.getFinishedAt() : LocalDateTime.now(clock);
    }

    private boolean emailMatchesJob(String jobName, EmailLog email) {
        if ("DAILY_DIGEST_SEND".equals(jobName)) {
            return "DAILY_MEMBER_DIGEST".equals(email.getEmailType());
        }
        return "OUTBOX_PUBLISH".equals(jobName) || "WEEKLY_REPORT_GENERATE".equals(jobName);
    }

    private boolean eventMatchesJob(String jobName, OutboxEvent event) {
        return switch (jobName) {
            case "DAILY_DIGEST_BUILD" -> "DAILY_DIGEST_BUILT".equals(event.getEventType());
            case "DAILY_DIGEST_SEND" -> "EMAIL_DAILY_DIGEST_SENT".equals(event.getEventType());
            case "WEEKLY_REPORT_GENERATE" -> "WEEKLY_REPORT_GENERATED".equals(event.getEventType());
            case "OUTBOX_PUBLISH" -> true;
            default -> false;
        };
    }

    private SchedulerEmailResponse toSchedulerEmail(EmailLog email) {
        UserAccount recipient = email.getRecipient();
        return SchedulerEmailResponse.builder()
                .id(email.getId())
                .recipientName(resolveAssigneeName(recipient))
                .recipientEmail(email.getRecipientEmail())
                .subject(email.getSubject())
                .status(email.getStatus())
                .errorMessage(email.getErrorMessage())
                .createdAt(email.getCreatedAt())
                .sentAt(email.getSentAt())
                .build();
    }

    private OutboxEventActivityResponse toOutboxActivity(OutboxEvent event) {
        JsonNode payload = parsePayload(event.getPayload());
        UserAccount recipient = resolvePayloadUser(payload);
        String payloadEmail = text(payload, "email");
        String recipientName = recipient != null ? resolveAssigneeName(recipient) : fallbackRecipientName(event, payload);
        String recipientEmail = recipient != null ? recipient.getEmail() : payloadEmail;

        return OutboxEventActivityResponse.builder()
                .id(event.getId())
                .eventType(event.getEventType())
                .status(event.getStatus())
                .recipientName(recipientName)
                .recipientEmail(recipientEmail)
                .actionLabel(actionLabel(event.getEventType()))
                .message(activityMessage(event.getEventType()))
                .targetLabel(targetLabel(event))
                .createdAt(event.getCreatedAt())
                .publishedAt(event.getPublishedAt())
                .build();
    }

    private JsonNode parsePayload(String payload) {
        if (payload == null || payload.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(payload);
        } catch (Exception ignored) {
            return objectMapper.createObjectNode();
        }
    }

    private UserAccount resolvePayloadUser(JsonNode payload) {
        Long userId = firstLong(payload, "userId", "assigneeId", "reviewerId", "recipientId");
        if (userId != null) {
            return userAccountRepository.findById(userId).orElse(null);
        }
        String email = text(payload, "email");
        if (email != null && !email.isBlank()) {
            return userAccountRepository.findByEmail(email).orElse(null);
        }
        return null;
    }

    private Long firstLong(JsonNode payload, String... fields) {
        for (String field : fields) {
            JsonNode value = payload.get(field);
            if (value != null && value.canConvertToLong()) {
                return value.asLong();
            }
        }
        return null;
    }

    private String text(JsonNode payload, String field) {
        JsonNode value = payload.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? null : text;
    }

    private String fallbackRecipientName(OutboxEvent event, JsonNode payload) {
        String name = text(payload, "recipientName");
        if (name != null) {
            return name;
        }
        if ("WEEKLY_REPORT_GENERATED".equals(event.getEventType())) {
            return "Leader and mentor";
        }
        if ("EVIDENCE_REVIEW_REQUIRED".equals(event.getEventType())) {
            return "Evidence reviewer";
        }
        return "Project team";
    }

    private String actionLabel(String eventType) {
        return switch (eventType) {
            case "TASK_PENALTY_APPLIED" -> "Task penalty alert";
            case "WEEKLY_REPORT_GENERATED" -> "Weekly report generated";
            case "EMAIL_DAILY_DIGEST_SENT" -> "Daily digest email sent";
            case "DAILY_DIGEST_BUILT" -> "Daily digest built";
            case "EVIDENCE_REVIEW_REQUIRED" -> "Evidence review requested";
            default -> eventType != null ? eventType.replace('_', ' ') : "Notification";
        };
    }

    private String activityMessage(String eventType) {
        return switch (eventType) {
            case "TASK_PENALTY_APPLIED" -> "The task missed its SLA or evidence rule, so a penalty alert was sent.";
            case "WEEKLY_REPORT_GENERATED" -> "A weekly report was generated for leader and mentor review.";
            case "EMAIL_DAILY_DIGEST_SENT" -> "A daily reminder email was sent to the related member.";
            case "DAILY_DIGEST_BUILT" -> "The system grouped risky tasks into a daily reminder list.";
            case "EVIDENCE_REVIEW_REQUIRED" -> "New evidence is waiting for leader or mentor review.";
            default -> "The system processed a queued notification.";
        };
    }

    private String targetLabel(OutboxEvent event) {
        String aggregateType = event.getAggregateType();
        Long aggregateId = event.getAggregateId();
        if (aggregateType == null || aggregateId == null) {
            return "Project related";
        }
        return switch (aggregateType) {
            case "TASK", "Task" -> "Task #" + aggregateId;
            case "EVIDENCE", "Evidence" -> "Evidence #" + aggregateId;
            case "WEEKLY_REPORT", "WeeklyReport" -> "Weekly report #" + aggregateId;
            case "DAILY_DIGEST", "DailyDigest" -> "Daily digest #" + aggregateId;
            case "PROJECT", "Project" -> "Project #" + aggregateId;
            default -> aggregateType + " #" + aggregateId;
        };
    }

    private List<SlaFlagResponse> buildFlags(int penaltyCount, int frozenTaskCount, long maxFrozenDays,
                                             int missingEvidenceCount, int dueSoonCount) {
        List<SlaFlagResponse> flags = new ArrayList<>();
        if (frozenTaskCount > 0) {
            flags.add(SlaFlagResponse.builder()
                    .label("FROZEN +" + maxFrozenDays + "d")
                    .tone("danger")
                    .count(frozenTaskCount)
                    .build());
        }
        if (penaltyCount > 0) {
            flags.add(SlaFlagResponse.builder()
                    .label("PENALTY")
                    .tone("danger")
                    .count(penaltyCount)
                    .build());
        }
        if (missingEvidenceCount > 0) {
            flags.add(SlaFlagResponse.builder()
                    .label("MISSING EV.")
                    .tone("warning")
                    .count(missingEvidenceCount)
                    .build());
        }
        if (dueSoonCount > 0) {
            flags.add(SlaFlagResponse.builder()
                    .label("DUE 24h")
                    .tone("warning")
                    .count(dueSoonCount)
                    .build());
        }
        if (flags.isEmpty()) {
            flags.add(SlaFlagResponse.builder()
                    .label("CLEAR")
                    .tone("success")
                    .count(0)
                    .build());
        }
        return flags;
    }

    private int percent(long value, long total) {
        if (total <= 0) {
            return 0;
        }
        return Math.max(0, Math.min(100, Math.round((value * 100f) / total)));
    }

    private SchedulerRunResponse toSchedulerRunResponse(SchedulerRunLog runLog) {
        return SchedulerRunResponse.builder()
                .jobName(runLog.getJobName())
                .status(runLog.getStatus())
                .startedAt(runLog.getStartedAt())
                .finishedAt(runLog.getFinishedAt())
                .totalScanned(runLog.getTotalScanned())
                .totalCreated(runLog.getTotalCreated())
                .totalSent(runLog.getTotalSent())
                .errorMessage(runLog.getErrorMessage())
                .build();
    }

    private SlaViolationResponse toViolation(Task task, TaskSlaEvaluation evaluation) {
        UserAccount assignee = task.getPrimaryAssignee();
        List<String> categories = new ArrayList<>(evaluation.categories().stream().map(Enum::name).toList());
        if (task.isOverduePenaltyApplied() && !categories.contains(TaskSlaCategory.OVERDUE_PENALTY.name())) {
            categories.add(TaskSlaCategory.OVERDUE_PENALTY.name());
        }

        return SlaViolationResponse.builder()
                .taskId(task.getId())
                .taskTitle(task.getTitle())
                .status(task.getStatus() != null ? task.getStatus().name() : null)
                .deadline(task.getDeadline())
                .updatedAt(task.getUpdatedAt())
                .assigneeId(assignee != null ? assignee.getId() : null)
                .assigneeName(resolveAssigneeName(assignee))
                .assigneeEmail(assignee != null ? assignee.getEmail() : null)
                .overdueDays(evaluation.overdueDays())
                .hasAcceptedEvidence(evaluation.hasAcceptedEvidence())
                .penaltyApplied(task.isOverduePenaltyApplied())
                .categories(categories)
                .reason(buildViolationReason(task, evaluation))
                .build();
    }

    private String resolveAssigneeName(UserAccount user) {
        if (user == null) {
            return "Unassigned";
        }
        if (user.getProfile() != null && user.getProfile().getFullName() != null && !user.getProfile().getFullName().isBlank()) {
            return user.getProfile().getFullName();
        }
        return user.getUsername();
    }

    private String buildViolationReason(Task task, TaskSlaEvaluation evaluation) {
        List<String> reasons = new ArrayList<>();
        if (evaluation.has(TaskSlaCategory.OVERDUE_FROZEN)) {
            reasons.add("overdue by " + evaluation.overdueDays() + " day(s), leader action needed");
        } else if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) {
            reasons.add("overdue by " + evaluation.overdueDays() + " day(s)");
        }
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY) || task.isOverduePenaltyApplied()) {
            reasons.add("penalty condition reached");
        }
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            reasons.add("Done but missing accepted evidence");
        }
        if (evaluation.has(TaskSlaCategory.DUE_SOON)) {
            reasons.add("deadline trong 24h");
        }
        if (evaluation.has(TaskSlaCategory.BLOCKED)) {
            reasons.add("blocked" + (task.getBlockedReason() != null ? ": " + task.getBlockedReason() : ""));
        }
        if (reasons.isEmpty()) {
            reasons.add("SLA review needed");
        }
        return String.join("; ", reasons);
    }

    private void ensureProjectMember(Long projectId, Long userId) {
        ensureLoggedIn(userId);
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isEmpty()) {
            throw new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN);
        }
    }

    private void ensureLoggedIn(Long userId) {
        if (userId == null || userAccountRepository.findById(userId).isEmpty()) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
    }
}
