package org.example.backend.service.ml;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.*;
import org.example.backend.repository.SlaDecisionLogRepository;
import org.example.backend.repository.RecoveryPlanRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.WeeklyReportMemberRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MlFeatureBuilder {

    private final TaskRepository taskRepository;
    private final SlaDecisionLogRepository slaDecisionLogRepository;
    private final RecoveryPlanRepository recoveryPlanRepository;
    private final WeeklyReportMemberRepository weeklyReportMemberRepository;
    private final Clock clock;

    /**
     * Build 37-feature request from task + current SLA state.
     * Uses defaults/fallbacks when data is unavailable.
     */
    public MlSlaRiskRequest build(Task task, TaskSlaState state) {
        LocalDate today = LocalDate.now(clock);

        // --- Group 1: Task State ---
        double deadlinePenalty  = parseScoreBreakdown(state, "deadlinePenalty");
        double burnRatePenalty  = parseScoreBreakdown(state, "burnRatePenalty");
        double blockerPenalty   = parseScoreBreakdown(state, "blockerPenalty");
        double workloadPenalty  = parseScoreBreakdown(state, "workloadPenalty");
        double burnGap          = state != null && state.getBurnGap() != null ? state.getBurnGap() : 0.0;
        double spi              = state != null && state.getSpi() != null ? state.getSpi() : 1.0;
        double daysUntil        = state != null && state.getDaysUntilDeadline() != null
                ? state.getDaysUntilDeadline() : 7.0;
        double overdueDays      = state != null ? state.getOverdueDays() : 0.0;
        double estimatedHours   = task.getEstimatedHours() != null ? task.getEstimatedHours().doubleValue() : 8.0;
        double weight           = task.getWeight() != null ? task.getWeight().doubleValue() : 1.0;
        int priorityEnc         = encodePriority(task.getPriority());
        int taskTypeEnc         = encodeTaskType(task.getType());

        // --- Group 2: Personal + Skill ---
        Long assigneeId = task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null;
        PersonalStats ps = assigneeId != null ? computePersonalStats(assigneeId) : PersonalStats.DEFAULT;

        double complexityGap = estimatedHours - ps.avgComplexityCompleted;
        int isNewMember = ps.totalSprints < 2 ? 1 : 0;

        // --- Group 3: Sprint Context ---
        Long sprintId = task.getSprintId();
        SprintStats ss = sprintId != null
                ? computeSprintStats(sprintId, task.getProject().getId(), today)
                : SprintStats.DEFAULT;

        long assigneeActiveTasks = assigneeId != null
                ? taskRepository.countActiveTasksByAssignee(assigneeId) : 3;

        // --- Group 4: Activity Signal ---
        double daysSinceUpdate = task.getUpdatedAt() != null
                ? ChronoUnit.DAYS.between(task.getUpdatedAt().toLocalDate(), today) : 0.0;
        double checklistPct = computeChecklistPct(task);
        int hasBlocker = (task.getBlockedReason() != null && !task.getBlockedReason().isBlank()) ? 1 : 0;

        // --- Group 5: Risk History ---
        Long projectId = task.getProject().getId();
        long taskId    = task.getId();

        List<SlaDecisionLog> logs = slaDecisionLogRepository
                .findByProjectIdAndTaskIdOrderByEvaluatedAtDesc(projectId, taskId);

        int riskEscalations = countEscalations(logs);
        int timesCritical   = (int) logs.stream()
                .filter(l -> "BREACH".equalsIgnoreCase(l.getNewRiskLevel())).count();
        long prevPlanCount  = recoveryPlanRepository.countByProjectIdAndTaskId(projectId, taskId);

        return MlSlaRiskRequest.builder()
                // Group 1
                .deadlinePenalty(deadlinePenalty)
                .burnRatePenalty(burnRatePenalty)
                .blockerPenalty(blockerPenalty)
                .workloadPenalty(workloadPenalty)
                .burnGap(burnGap)
                .spi(spi)
                .daysUntilDeadline(daysUntil)
                .overdueDays(overdueDays)
                .estimatedHours(estimatedHours)
                .weight(weight)
                .priorityEncoded(priorityEnc)
                .taskTypeEncoded(taskTypeEnc)
                // Group 2
                .lifetimeOntimeRate(ps.lifetimeOntimeRate)
                .lifetimePenaltyRate(ps.lifetimePenaltyRate)
                .totalSprintsParticipated(ps.totalSprints)
                .ontimeRateByTaskType(ps.ontimeRateByType)
                .avgComplexityCompleted(ps.avgComplexityCompleted)
                .complexityGap(complexityGap)
                .blockerRate(ps.blockerRate)
                .staleExplanationRate(ps.staleExplanationRate)
                .recoverySuccessRate(ps.recoverySuccessRate)
                .isNewMember(isNewMember)
                // Group 3
                .sprintProgressRatio(ss.progressRatio)
                .daysToSprintEnd(ss.daysToEnd)
                .sprintTeamSize(ss.teamSize)
                .assigneeActiveTasks((int) Math.min(assigneeActiveTasks, 15))
                .sprintOverdueCount(ss.overdueCount)
                .sprintHighRiskCount(ss.highRiskCount)
                .sprintAvgSpi(ss.avgSpi)
                .teamBlockerCount(ss.blockerCount)
                // Group 4
                .daysSinceLastUpdate(Math.min(daysSinceUpdate, 14))
                .checklistDonePct(checklistPct)
                .hasBlocker(hasBlocker)
                .commitsLast7d(0) // GitHubCommit query omitted for now
                // Group 5
                .riskEscalationCount(Math.min(riskEscalations, 8))
                .previousPlanCount((int) Math.min(prevPlanCount, 6))
                .timesEnteredCritical(Math.min(timesCritical, 5))
                .build();
    }

    // ---------------------------------------------------------------------------

    private double computeChecklistPct(Task task) {
        List<TaskChecklist> checklist = task.getChecklist();
        if (checklist == null || checklist.isEmpty()) return 0.5;
        long done = checklist.stream().filter(TaskChecklist::isDone).count();
        return (double) done / checklist.size();
    }

    private int countEscalations(List<SlaDecisionLog> logs) {
        int count = 0;
        for (SlaDecisionLog log : logs) {
            if (riskOrder(log.getNewRiskLevel()) > riskOrder(log.getPreviousRiskLevel())) count++;
        }
        return count;
    }

    private int riskOrder(String level) {
        if (level == null) return 0;
        return switch (level.toUpperCase()) {
            case "HEALTHY", "ON_TRACK" -> 0;
            case "AT_RISK"  -> 1;
            case "WARNING"  -> 2;
            case "BREACH"   -> 3;
            default         -> 0;
        };
    }

    private int encodePriority(Priority p) {
        if (p == null) return 1;
        return switch (p) {
            case LOW      -> 0;
            case MEDIUM   -> 1;
            case HIGH     -> 2;
            case CRITICAL -> 3;
        };
    }

    private int encodeTaskType(TaskType t) {
        if (t == null) return 0;
        return switch (t) {
            case DEVELOPMENT  -> 0;
            case BUG_FIX      -> 1;
            case REVIEW       -> 2;
            case TESTING      -> 3;
            default           -> 0;
        };
    }

    // --- Personal stats from WeeklyReportMember aggregate ---

    private PersonalStats computePersonalStats(Long userId) {
        List<WeeklyReportMember> records = weeklyReportMemberRepository.findByUserId(userId);
        if (records.isEmpty()) return PersonalStats.DEFAULT;

        int totalAssigned  = records.stream().mapToInt(WeeklyReportMember::getTotalAssignedCount).sum();
        int totalOnTime    = records.stream().mapToInt(WeeklyReportMember::getCompletedOnTimeCount).sum();
        int totalPenalized = records.stream().mapToInt(WeeklyReportMember::getPenalizedTaskCount).sum();
        int totalFrozen    = records.stream().mapToInt(WeeklyReportMember::getFrozenTaskCount).sum();
        int totalStale     = records.stream().mapToInt(WeeklyReportMember::getStaleExplanationCount).sum();

        if (totalAssigned == 0) return PersonalStats.DEFAULT;

        double ontimeRate   = (double) totalOnTime    / totalAssigned;
        double penaltyRate  = (double) totalPenalized / totalAssigned;
        double blockerRate  = (double) totalFrozen    / totalAssigned;
        double staleRate    = (double) totalStale     / totalAssigned;

        // Avg estimated hours of completed tasks by this user
        double avgComplex = taskRepository.avgEstimatedHoursOfCompletedTasks(userId);
        if (avgComplex <= 0) avgComplex = 8.0;

        return new PersonalStats(
                ontimeRate, penaltyRate, records.size(),
                ontimeRate, // same as lifetime for type (simplified)
                avgComplex, blockerRate, staleRate,
                Math.max(0.3, ontimeRate) // recovery success proxy
        );
    }

    // --- Sprint stats from TaskSlaState aggregate ---

    private SprintStats computeSprintStats(Long sprintId, Long projectId, LocalDate today) {
        try {
            List<Object[]> rows = taskRepository.sprintSlaStats(sprintId, projectId);
            if (rows == null || rows.isEmpty()) return SprintStats.DEFAULT;

            Object[] r      = rows.get(0);
            long total      = r[0] != null ? ((Number) r[0]).longValue() : 0;
            long overdue    = r[1] != null ? ((Number) r[1]).longValue() : 0;
            long highRisk   = r[2] != null ? ((Number) r[2]).longValue() : 0;
            long blockers   = r[3] != null ? ((Number) r[3]).longValue() : 0;
            double avgSpi   = r[4] != null ? ((Number) r[4]).doubleValue() : 0.85;
            long memberCount = r[5] != null ? ((Number) r[5]).longValue() : 4;

            // Estimate sprint progress from SPI average
            double progress = Math.min(1.0, Math.max(0.0, avgSpi * 0.6));
            double daysToEnd = Math.max(0, (1 - progress) * 14);

            return new SprintStats(
                    progress, daysToEnd, (int) Math.max(1, memberCount),
                    (int) overdue, (int) highRisk, avgSpi, (int) blockers
            );
        } catch (Exception ex) {
            return SprintStats.DEFAULT;
        }
    }

    // --- Score breakdown parsing ---

    private double parseScoreBreakdown(TaskSlaState state, String field) {
        if (state == null || state.getScoreBreakdownJson() == null) return 0.0;
        try {
            String json = state.getScoreBreakdownJson();
            // simple key extraction without full Jackson to avoid circular dep
            String key = "\"" + toSnakeCase(field) + "\":";
            int idx = json.indexOf(key);
            if (idx < 0) return 0.0;
            int start = idx + key.length();
            int end   = json.indexOf(",", start);
            if (end < 0) end = json.indexOf("}", start);
            return Double.parseDouble(json.substring(start, end).trim());
        } catch (Exception e) {
            return 0.0;
        }
    }

    private String toSnakeCase(String camel) {
        return camel.replaceAll("([A-Z])", "_$1").toLowerCase().replaceFirst("^_", "");
    }

    // --- Inner value classes ---

    private record PersonalStats(
            double lifetimeOntimeRate, double lifetimePenaltyRate, int totalSprints,
            double ontimeRateByType, double avgComplexityCompleted,
            double blockerRate, double staleExplanationRate, double recoverySuccessRate) {

        static final PersonalStats DEFAULT = new PersonalStats(
                0.65, 0.15, 0, 0.65, 8.0, 0.15, 0.15, 0.50);
    }

    private record SprintStats(
            double progressRatio, double daysToEnd, int teamSize,
            int overdueCount, int highRiskCount, double avgSpi, int blockerCount) {

        static final SprintStats DEFAULT = new SprintStats(
                0.5, 7.0, 4, 1, 1, 0.85, 0);
    }
}
