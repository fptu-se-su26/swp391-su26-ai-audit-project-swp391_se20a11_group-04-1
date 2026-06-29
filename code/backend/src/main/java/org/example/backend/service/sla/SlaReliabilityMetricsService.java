package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.SlaDecisionLog;
import org.example.backend.entity.SlaReliabilitySnapshot;
import org.example.backend.entity.TaskPenaltyLog;
import org.example.backend.dto.SlaReliabilityReportResponse;
import org.example.backend.entity.Sprint;
import org.example.backend.repository.SlaDecisionLogRepository;
import org.example.backend.repository.SlaReliabilitySnapshotRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.TaskPenaltyLogRepository;
import org.example.backend.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaReliabilityMetricsService {

    private static final Set<String> FAILURE_LEVELS = Set.of("HIGH", "CRITICAL");
    private static final Set<String> HEALTHY_LEVELS = Set.of("NORMAL", "LOW");

    private final SlaDecisionLogRepository decisionLogRepository;
    private final TaskPenaltyLogRepository penaltyLogRepository;
    private final SlaReliabilitySnapshotRepository snapshotRepository;
    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final GeminiReliabilityService geminiReliabilityService;

    @Value("${app.reliability.healthy-threshold:75}")
    private int healthyThreshold;

    @Value("${app.reliability.budget-pct:10.0}")
    private double defaultBudgetPct;

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    @Transactional
    public SlaReliabilitySnapshot computeAndPersist(Long projectId, Long sprintId) {
        MttrResult mttr = computeMttr(projectId, sprintId);
        MtbfResult mtbf = computeMtbf(projectId, sprintId);
        AvailabilityResult avail = computeAvailability(projectId, sprintId);
        ErrorBudgetResult budget = computeErrorBudget(projectId, sprintId, defaultBudgetPct);

        String narrative = buildNarrative(projectId, sprintId, mttr, avail, budget);

        SlaReliabilitySnapshot snapshot = SlaReliabilitySnapshot.builder()
                .projectId(projectId)
                .sprintId(sprintId)
                .mttrHours(mttr.mttrHours())
                .mttrSampleCount(mttr.sampleCount())
                .mtbfDays(mtbf.mtbfDays())
                .mtbfSampleCount(mtbf.sampleCount())
                .availabilityPct(avail.availabilityPct())
                .healthyThreshold(healthyThreshold)
                .totalIntervals(avail.totalIntervals())
                .healthyIntervals(avail.healthyIntervals())
                .budgetPct(BigDecimal.valueOf(defaultBudgetPct))
                .totalTasks(budget.totalTasks())
                .penalizedTasks(budget.penalizedTasks())
                .errorBudgetConsumedPct(budget.consumedPct())
                .errorBudgetRemainingPct(budget.remainingPct())
                .aiNarrative(narrative)
                .build();

        // Upsert: delete old snapshot then save new
        snapshotRepository.deleteByProjectIdAndSprintId(projectId, sprintId);
        return snapshotRepository.save(snapshot);
    }

    public Optional<SlaReliabilitySnapshot> findSnapshot(Long projectId, Long sprintId) {
        return snapshotRepository.findByProjectIdAndSprintId(projectId, sprintId);
    }

    public List<SlaReliabilitySnapshot> findProjectHistory(Long projectId) {
        return snapshotRepository.findByProjectIdOrderByComputedAtDesc(projectId);
    }

    @Transactional
    public SlaReliabilityReportResponse getOrComputeReport(Long projectId, Long sprintId, boolean refresh) {
        SlaReliabilitySnapshot snapshot;
        if (!refresh) {
            snapshot = snapshotRepository.findByProjectIdAndSprintId(projectId, sprintId)
                    .orElseGet(() -> computeAndPersist(projectId, sprintId));
        } else {
            snapshot = computeAndPersist(projectId, sprintId);
        }
        return toResponse(snapshot);
    }

    private SlaReliabilityReportResponse toResponse(SlaReliabilitySnapshot s) {
        // Build sprint name lookup map from last 10 snapshots
        List<SlaReliabilitySnapshot> history =
                snapshotRepository.findByProjectIdOrderByComputedAtDesc(s.getProjectId());

        Map<Long, String> sprintNames = sprintRepository
                .findByProjectIdOrderByStartDateAscIdAsc(s.getProjectId())
                .stream()
                .collect(Collectors.toMap(Sprint::getId, Sprint::getName, (a, b) -> a));

        String trend = computeMttrTrend(s.getProjectId(), s.getSprintId());
        BigDecimal reliabilityScore = computeReliabilityScore(s);

        List<SlaReliabilityReportResponse.SprintTrendPoint> trendHistory = history.stream()
                .limit(6)
                .map(h -> SlaReliabilityReportResponse.SprintTrendPoint.builder()
                        .sprintId(h.getSprintId())
                        .sprintName(sprintNames.getOrDefault(h.getSprintId(), "Sprint " + h.getSprintId()))
                        .availabilityPct(h.getAvailabilityPct())
                        .errorBudgetConsumedPct(h.getErrorBudgetConsumedPct())
                        .mttrHours(h.getMttrHours())
                        .reliabilityScore(computeReliabilityScore(h))
                        .computedAt(h.getComputedAt())
                        .build())
                .collect(Collectors.toList());

        return SlaReliabilityReportResponse.builder()
                .projectId(s.getProjectId())
                .sprintId(s.getSprintId())
                .mttrHours(s.getMttrHours())
                .mttrSampleCount(s.getMttrSampleCount())
                .mttrTrend(trend)
                .mtbfDays(s.getMtbfDays())
                .mtbfSampleCount(s.getMtbfSampleCount())
                .availabilityPct(s.getAvailabilityPct())
                .totalIntervals(s.getTotalIntervals())
                .healthyIntervals(s.getHealthyIntervals())
                .healthyThreshold(s.getHealthyThreshold())
                .budgetPct(s.getBudgetPct())
                .totalTasks(s.getTotalTasks())
                .penalizedTasks(s.getPenalizedTasks())
                .errorBudgetConsumedPct(s.getErrorBudgetConsumedPct())
                .errorBudgetRemainingPct(s.getErrorBudgetRemainingPct())
                .reliabilityScore(reliabilityScore)
                .trendHistory(trendHistory)
                .aiNarrative(s.getAiNarrative())
                .computedAt(s.getComputedAt())
                .build();
    }

    // -----------------------------------------------------------------------
    // MTTR — Mean Time To Recovery (hours)
    // -----------------------------------------------------------------------

    MttrResult computeMttr(Long projectId, Long sprintId) {
        List<SlaDecisionLog> logs = decisionLogRepository
                .findByProjectAndSprintOrdered(projectId, sprintId);

        if (logs.isEmpty()) {
            return new MttrResult(null, 0);
        }

        Map<Long, List<SlaDecisionLog>> byTask = groupByTaskId(logs);
        List<Long> recoveryHours = new ArrayList<>();

        for (List<SlaDecisionLog> taskLogs : byTask.values()) {
            int i = 0;
            while (i < taskLogs.size()) {
                // Find failure onset
                while (i < taskLogs.size() && !FAILURE_LEVELS.contains(taskLogs.get(i).getNewRiskLevel())) {
                    i++;
                }
                if (i >= taskLogs.size()) break;
                int failureIdx = i;

                // Find recovery after failure
                i++;
                while (i < taskLogs.size() && !HEALTHY_LEVELS.contains(taskLogs.get(i).getNewRiskLevel())) {
                    i++;
                }
                if (i >= taskLogs.size()) break;

                long hours = ChronoUnit.HOURS.between(
                        taskLogs.get(failureIdx).getEvaluatedAt(),
                        taskLogs.get(i).getEvaluatedAt());
                if (hours >= 0) {
                    recoveryHours.add(hours);
                }
                i++;
            }
        }

        if (recoveryHours.isEmpty()) {
            return new MttrResult(null, 0);
        }

        double avg = recoveryHours.stream().mapToLong(Long::longValue).average().orElse(0);
        return new MttrResult(
                BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP),
                recoveryHours.size());
    }

    // -----------------------------------------------------------------------
    // MTBF — Mean Time Between Failures (days)
    // -----------------------------------------------------------------------

    MtbfResult computeMtbf(Long projectId, Long sprintId) {
        List<TaskPenaltyLog> logs = penaltyLogRepository
                .findByProjectAndSprintOrdered(projectId, sprintId);

        if (logs.isEmpty()) {
            return new MtbfResult(null, 0);
        }

        Map<Long, List<TaskPenaltyLog>> byTask = logs.stream()
                .collect(Collectors.groupingBy(
                        tpl -> tpl.getTask().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));

        List<Long> gaps = new ArrayList<>();
        for (List<TaskPenaltyLog> taskLogs : byTask.values()) {
            if (taskLogs.size() < 2) continue;
            for (int i = 1; i < taskLogs.size(); i++) {
                long days = ChronoUnit.DAYS.between(
                        taskLogs.get(i - 1).getAppliedAt(),
                        taskLogs.get(i).getAppliedAt());
                if (days > 0) {
                    gaps.add(days);
                }
            }
        }

        if (gaps.isEmpty()) {
            return new MtbfResult(null, 0);
        }

        double avg = gaps.stream().mapToLong(Long::longValue).average().orElse(0);
        return new MtbfResult(
                BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP),
                gaps.size());
    }

    // -----------------------------------------------------------------------
    // Availability %
    // -----------------------------------------------------------------------

    AvailabilityResult computeAvailability(Long projectId, Long sprintId) {
        List<SlaDecisionLog> logs = decisionLogRepository
                .findByProjectAndSprintOrdered(projectId, sprintId);

        int total = logs.size();
        if (total == 0) {
            return new AvailabilityResult(null, 0, 0);
        }

        int healthy = (int) logs.stream()
                .filter(d -> d.getNewScore() >= healthyThreshold)
                .count();

        BigDecimal pct = BigDecimal.valueOf((double) healthy / total * 100)
                .setScale(2, RoundingMode.HALF_UP);

        return new AvailabilityResult(pct, total, healthy);
    }

    // -----------------------------------------------------------------------
    // Error Budget
    // -----------------------------------------------------------------------

    ErrorBudgetResult computeErrorBudget(Long projectId, Long sprintId, double budgetPct) {
        long totalTasks = taskRepository.countByProjectIdAndSprintId(projectId, sprintId);
        if (totalTasks == 0) {
            return new ErrorBudgetResult(0, 0,
                    BigDecimal.ZERO, BigDecimal.valueOf(100));
        }

        List<TaskPenaltyLog> logs = penaltyLogRepository
                .findByProjectAndSprintOrdered(projectId, sprintId);

        long penalizedTasks = logs.stream()
                .map(tpl -> tpl.getTask().getId())
                .distinct()
                .count();

        long budgetAllowed = Math.max(1, (long) Math.floor(budgetPct / 100.0 * totalTasks));

        double rawConsumed = (double) penalizedTasks / budgetAllowed * 100.0;
        double consumed = Math.min(100.0, rawConsumed);
        double remaining = Math.max(0.0, 100.0 - consumed);

        return new ErrorBudgetResult(
                (int) totalTasks,
                (int) penalizedTasks,
                BigDecimal.valueOf(consumed).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(remaining).setScale(2, RoundingMode.HALF_UP));
    }

    // -----------------------------------------------------------------------
    // Composite Reliability Score (0-100, not persisted)
    // -----------------------------------------------------------------------

    public BigDecimal computeReliabilityScore(SlaReliabilitySnapshot s) {
        double avail = s.getAvailabilityPct() != null
                ? s.getAvailabilityPct().doubleValue() : 100.0;
        double budgetRemaining = s.getErrorBudgetRemainingPct() != null
                ? s.getErrorBudgetRemainingPct().doubleValue() : 100.0;
        double mttrScore = mttrToScore(s.getMttrHours());

        double score = avail * 0.50 + budgetRemaining * 0.30 + mttrScore * 0.20;
        return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
    }

    public String computeMttrTrend(Long projectId, Long sprintId) {
        List<SlaReliabilitySnapshot> history =
                snapshotRepository.findByProjectIdOrderByComputedAtDesc(projectId);

        SlaReliabilitySnapshot current = history.stream()
                .filter(s -> s.getSprintId().equals(sprintId))
                .findFirst().orElse(null);
        if (current == null || current.getMttrHours() == null) return "INSUFFICIENT_DATA";

        SlaReliabilitySnapshot previous = history.stream()
                .filter(s -> !s.getSprintId().equals(sprintId) && s.getMttrHours() != null)
                .findFirst().orElse(null);
        if (previous == null) return "INSUFFICIENT_DATA";

        int cmp = current.getMttrHours().compareTo(previous.getMttrHours());
        if (cmp < 0) return "IMPROVING";
        if (cmp > 0) return "DEGRADING";
        return "STABLE";
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private Map<Long, List<SlaDecisionLog>> groupByTaskId(List<SlaDecisionLog> logs) {
        Map<Long, List<SlaDecisionLog>> map = new LinkedHashMap<>();
        for (SlaDecisionLog log : logs) {
            Long taskId = log.getTask().getId();
            map.computeIfAbsent(taskId, k -> new ArrayList<>()).add(log);
        }
        return map;
    }

    private double mttrToScore(BigDecimal mttrHours) {
        if (mttrHours == null) return 50.0;
        double h = mttrHours.doubleValue();
        if (h < 24) return 100.0;
        if (h < 48) return 75.0;
        if (h < 72) return 50.0;
        return 25.0;
    }

    private String buildNarrative(Long projectId, Long sprintId,
                                   MttrResult mttr, AvailabilityResult avail,
                                   ErrorBudgetResult budget) {
        try {
            return geminiReliabilityService.generateNarrative(
                    projectId, sprintId, mttr, avail, budget, healthyThreshold);
        } catch (Exception ex) {
            log.warn("GeminiReliabilityService failed, skipping narrative: {}", ex.getMessage());
            return null;
        }
    }

    // -----------------------------------------------------------------------
    // Result records
    // -----------------------------------------------------------------------

    public record MttrResult(BigDecimal mttrHours, int sampleCount) {}
    public record MtbfResult(BigDecimal mtbfDays, int sampleCount) {}
    public record AvailabilityResult(BigDecimal availabilityPct, int totalIntervals, int healthyIntervals) {}
    public record ErrorBudgetResult(int totalTasks, int penalizedTasks,
                                    BigDecimal consumedPct, BigDecimal remainingPct) {}
}
