package org.example.backend.service.sla;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.example.backend.entity.EvidenceEntityType;
import org.example.backend.entity.EvidenceLink;
import org.example.backend.entity.EvidenceStatus;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskChecklist;
import org.example.backend.entity.TaskStatus;
import org.example.backend.repository.EvidenceLinkRepository;
import org.example.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SlaRiskAssessmentService {
    private final TaskRepository taskRepository;
    private final EvidenceLinkRepository evidenceLinkRepository;
    private final Clock clock;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class AssessmentResult {
        private final int score;
        private final String riskLevel;
        private final List<String> reasons;
        private final String recommendedAction;
        private final double burnGap;
        private final String burnRateLevel;
        private final double spi;
        private final String predictedRiskLevel;
        private final List<String> predictionReasons;
        private final ScoreBreakdown scoreBreakdown;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ScoreBreakdown {
        private final int deadlinePenalty;
        private final int burnRatePenalty;
        private final int evidencePenalty;
        private final int blockerPenalty;
        private final int workloadPenalty;
    }

    public AssessmentResult assess(Task task, TaskSlaEvaluation evaluation) {
        LocalDate today = LocalDate.now(clock);
        double timeUsedPercent = calculateTimeUsedPercent(task, today);
        double progressPercent = calculateProgressPercent(task);
        double burnGap = timeUsedPercent - progressPercent;
        String burnRateLevel = resolveBurnRateLevel(burnGap);
        double spi = timeUsedPercent <= 0 ? 1.0 : Math.min(2.0, progressPercent / timeUsedPercent);

        int deadlinePenalty = calculateDeadlinePenalty(task, evaluation, today);
        int burnRatePenalty = task.getStatus() == TaskStatus.DONE ? 0 : switch (burnRateLevel) {
            case "MEDIUM" -> 8;
            case "HIGH" -> 18;
            case "CRITICAL" -> 30;
            default -> 0;
        };
        int adjustedBurnPenalty = (int) Math.round(burnRatePenalty * weightMultiplier(burnRateLevel));
        int evidencePenalty = calculateEvidencePenalty(task, evaluation);
        int blockerPenalty = calculateBlockerPenalty(task, evaluation);
        int workloadPenalty = calculateWorkloadPenalty(task);

        int rawPenalty = deadlinePenalty + adjustedBurnPenalty + evidencePenalty + blockerPenalty + workloadPenalty;
        int score = Math.max(0, 100 - rawPenalty);

        String riskLevel;
        if (score <= 20) {
            riskLevel = "CRITICAL";
        } else if (score <= 45) {
            riskLevel = "HIGH";
        } else if (score <= 75) {
            riskLevel = "MEDIUM";
        } else if (score < 100) {
            riskLevel = "LOW";
        } else {
            riskLevel = "NORMAL";
        }

        List<String> reasons = new ArrayList<>();
        if (evaluation.has(TaskSlaCategory.DUE_IN_3_DAYS)) reasons.add("Task deadline is in 3 days.");
        if (evaluation.has(TaskSlaCategory.DUE_IN_2_DAYS)) reasons.add("Task deadline is in 2 days.");
        if (evaluation.has(TaskSlaCategory.DUE_TOMORROW)) reasons.add("Task deadline is tomorrow.");
        if (evaluation.has(TaskSlaCategory.DUE_TODAY)) reasons.add("Task deadline is today.");
        if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) {
            reasons.add("Task is overdue by " + evaluation.overdueDays() + " day(s), still in warning period.");
        }
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) {
            reasons.add("Task is overdue by " + evaluation.overdueDays() + " day(s) and qualifies for penalty.");
        }
        if (evaluation.has(TaskSlaCategory.BLOCKED)) reasons.add("Task is blocked.");
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) reasons.add("Task is missing accepted evidence.");
        if (reasons.isEmpty() && evaluation.has(TaskSlaCategory.NORMAL)) {
            reasons.add("Task SLA is normal.");
        }
        if (burnGap > 25 && task.getStatus() != TaskStatus.DONE) {
            reasons.add(String.format("Burn rate is %s: %.0f%% of planned time used but only %.0f%% progress completed.",
                    burnRateLevel, timeUsedPercent, progressPercent));
        }

        List<String> actions = new ArrayList<>();
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) actions.add("Escalate this task and request recovery action.");
        else if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) actions.add("Follow up before this task becomes penalized.");
        else if (evaluation.has(TaskSlaCategory.DUE_TODAY)) actions.add("Finish or update this task before the end of today.");
        else if (evaluation.has(TaskSlaCategory.DUE_TOMORROW)) actions.add("Prepare to complete this task by tomorrow.");
        else if (evaluation.has(TaskSlaCategory.DUE_IN_2_DAYS) || evaluation.has(TaskSlaCategory.DUE_IN_3_DAYS)) {
            actions.add("Plan remaining work before the deadline.");
        }
        if (evaluation.has(TaskSlaCategory.BLOCKED)) actions.add("Clarify blocker and request leader support.");
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) actions.add("Upload or request accepted evidence.");
        if ("HIGH".equals(burnRateLevel) || "CRITICAL".equals(burnRateLevel)) {
            actions.add("Review remaining work because progress is behind planned time.");
        }
        String recommendedAction = actions.isEmpty() ? "No action required." : String.join(" ", actions);

        String predictedRiskLevel = predictRiskLevel(task, evaluation, riskLevel, burnRateLevel, progressPercent, today);
        List<String> predictionReasons = buildPredictionReasons(
                task, evaluation, timeUsedPercent, progressPercent, burnGap, workloadPenalty, today);

        if (task.getStatus() == TaskStatus.DONE) {
            score = 100;
            riskLevel = "NORMAL";
            predictedRiskLevel = "NORMAL";
            reasons = List.of("Task is resolved (DONE).");
            predictionReasons = List.of();
            recommendedAction = "No action required.";
        }

        ScoreBreakdown scoreBreakdown = ScoreBreakdown.builder()
                .deadlinePenalty(task.getStatus() == TaskStatus.DONE ? 0 : deadlinePenalty)
                .burnRatePenalty(task.getStatus() == TaskStatus.DONE ? 0 : adjustedBurnPenalty)
                .evidencePenalty(task.getStatus() == TaskStatus.DONE ? 0 : evidencePenalty)
                .blockerPenalty(task.getStatus() == TaskStatus.DONE ? 0 : blockerPenalty)
                .workloadPenalty(task.getStatus() == TaskStatus.DONE ? 0 : workloadPenalty)
                .build();

        return AssessmentResult.builder()
                .score(score)
                .riskLevel(riskLevel)
                .reasons(reasons)
                .recommendedAction(recommendedAction)
                .burnGap(round(burnGap))
                .burnRateLevel(burnRateLevel)
                .spi(round(spi))
                .predictedRiskLevel(predictedRiskLevel)
                .predictionReasons(predictionReasons)
                .scoreBreakdown(scoreBreakdown)
                .build();
    }

    private double calculateTimeUsedPercent(Task task, LocalDate today) {
        LocalDate startDate = task.getStartDate() != null
                ? task.getStartDate()
                : task.getCreatedAt() != null ? task.getCreatedAt().toLocalDate() : today;
        if (task.getDeadline() == null) {
            return 0.0;
        }
        long totalPlannedDays = ChronoUnit.DAYS.between(startDate, task.getDeadline());
        long elapsedDays = ChronoUnit.DAYS.between(startDate, today);
        return totalPlannedDays <= 0 ? 1.0 : Math.min(1.0, (double) elapsedDays / totalPlannedDays) * 100;
    }

    private double calculateProgressPercent(Task task) {
        List<TaskChecklist> checklist = task.getChecklist();
        if (checklist != null && !checklist.isEmpty()) {
            long done = checklist.stream().filter(TaskChecklist::isDone).count();
            return (double) done / checklist.size() * 100;
        }
        return switch (task.getStatus()) {
            case TODO -> 0;
            case IN_PROGRESS -> 40;
            case IN_REVIEW -> 80;
            case DONE -> 100;
            default -> 20;
        };
    }

    private String resolveBurnRateLevel(double burnGap) {
        if (burnGap <= 10) return "LOW";
        if (burnGap <= 25) return "MEDIUM";
        if (burnGap <= 45) return "HIGH";
        return "CRITICAL";
    }

    private int calculateDeadlinePenalty(Task task, TaskSlaEvaluation evaluation, LocalDate today) {
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) return 35;
        if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) return 25;
        if (evaluation.has(TaskSlaCategory.DUE_TODAY)) return 15;
        if (evaluation.has(TaskSlaCategory.DUE_TOMORROW)) return 10;
        if (task.getDeadline() != null) {
            long daysLeft = ChronoUnit.DAYS.between(today, task.getDeadline());
            if (daysLeft <= 3) return 5;
        }
        return 0;
    }

    private int calculateEvidencePenalty(Task task, TaskSlaEvaluation evaluation) {
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) return 15;
        return hasPendingEvidence(task) ? 8 : 0;
    }

    private boolean hasPendingEvidence(Task task) {
        if (task.getId() == null) {
            return false;
        }
        List<EvidenceLink> links = evidenceLinkRepository.findByEntityTypeAndEntityId(EvidenceEntityType.TASK, task.getId());
        return links.stream()
                .anyMatch(link -> link.getEvidence() != null
                        && (link.getEvidence().getStatus() == EvidenceStatus.PENDING
                        || link.getEvidence().getStatus() == EvidenceStatus.AUTO_CHECKED
                        || link.getEvidence().getStatus() == EvidenceStatus.NEEDS_CLARIFICATION));
    }

    private int calculateBlockerPenalty(Task task, TaskSlaEvaluation evaluation) {
        if (!evaluation.has(TaskSlaCategory.BLOCKED)) {
            return 0;
        }
        boolean hasBlockerReason = (task.getBlockedReason() != null && !task.getBlockedReason().isBlank())
                || (task.getDescription() != null && !task.getDescription().isBlank());
        return hasBlockerReason ? 15 : 20;
    }

    private int calculateWorkloadPenalty(Task task) {
        if (task.getPrimaryAssignee() == null) {
            return 0;
        }
        long activeCount = taskRepository.countActiveTasksByAssignee(task.getPrimaryAssignee().getId());
        if (activeCount >= 6) return 10;
        if (activeCount >= 3) return 5;
        return 0;
    }

    private double weightMultiplier(String burnRateLevel) {
        return switch (burnRateLevel) {
            case "MEDIUM" -> 1.1;
            case "HIGH" -> 1.2;
            case "CRITICAL" -> 1.3;
            default -> 1.0;
        };
    }

    private String predictRiskLevel(Task task, TaskSlaEvaluation evaluation, String riskLevel,
                                    String burnRateLevel, double progressPercent, LocalDate today) {
        String predictedRiskLevel = riskLevel;
        if ("MEDIUM".equals(riskLevel) && "HIGH".equals(burnRateLevel)) {
            predictedRiskLevel = "HIGH";
        }
        if (task.getDeadline() != null) {
            long daysLeft = ChronoUnit.DAYS.between(today, task.getDeadline());
            if (daysLeft <= 1 && progressPercent < 50) {
                predictedRiskLevel = "HIGH";
            }
        }
        if ("CRITICAL".equals(burnRateLevel) && evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            predictedRiskLevel = "CRITICAL";
        }
        return predictedRiskLevel;
    }

    private List<String> buildPredictionReasons(Task task, TaskSlaEvaluation evaluation,
                                                double timeUsedPercent, double progressPercent,
                                                double burnGap, int workloadPenalty, LocalDate today) {
        List<String> predictionReasons = new ArrayList<>();
        if (burnGap > 25) {
            predictionReasons.add(String.format(
                    "%.0f%% of planned time used but only %.0f%% progress completed",
                    timeUsedPercent, progressPercent));
        }
        if (task.getDeadline() != null) {
            long daysLeft = ChronoUnit.DAYS.between(today, task.getDeadline());
            if (daysLeft <= 1) {
                predictionReasons.add("Deadline is " + (daysLeft <= 0 ? "overdue" : "tomorrow"));
            }
        }
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            predictionReasons.add("Missing accepted evidence");
        }
        if (evaluation.has(TaskSlaCategory.BLOCKED)) {
            predictionReasons.add("Task is currently blocked");
        }
        if (workloadPenalty >= 10) {
            predictionReasons.add("Assignee is overloaded with multiple active tasks");
        }
        return predictionReasons;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
