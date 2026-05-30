package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.OutboxSummaryResponse;
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
    private final TaskSlaRuleService taskSlaRuleService;
    private final UserAccountRepository userAccountRepository;
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
                .build();
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
            reasons.add("trễ " + evaluation.overdueDays() + " ngày, cần leader xử lý");
        } else if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) {
            reasons.add("trễ " + evaluation.overdueDays() + " ngày");
        }
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY) || task.isOverduePenaltyApplied()) {
            reasons.add("đã chạm điều kiện penalty");
        }
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            reasons.add("Done nhưng thiếu accepted evidence");
        }
        if (evaluation.has(TaskSlaCategory.DUE_SOON)) {
            reasons.add("deadline trong 24h");
        }
        if (evaluation.has(TaskSlaCategory.BLOCKED)) {
            reasons.add("đang blocked" + (task.getBlockedReason() != null ? ": " + task.getBlockedReason() : ""));
        }
        if (reasons.isEmpty()) {
            reasons.add("cần kiểm tra SLA");
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
