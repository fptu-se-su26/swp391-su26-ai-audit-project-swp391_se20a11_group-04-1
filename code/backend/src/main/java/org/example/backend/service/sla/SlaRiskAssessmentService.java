package org.example.backend.service.sla;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SlaRiskAssessmentService {

    @Getter
    @Builder
    @AllArgsConstructor
    public static class AssessmentResult {
        private final int score;
        private final String riskLevel;
        private final List<String> reasons;
        private final String recommendedAction;
    }

    public AssessmentResult assess(Task task, TaskSlaEvaluation evaluation) {
        // Calculate score
        int baseScore = 100;
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY)) {
            baseScore = 0;
        } else if (evaluation.has(TaskSlaCategory.OVERDUE_SHORT)) {
            if (evaluation.overdueDays() == 1) {
                baseScore = 30;
            } else if (evaluation.overdueDays() == 2) {
                baseScore = 15;
            } else {
                baseScore = 30;
            }
        } else if (evaluation.has(TaskSlaCategory.DUE_TODAY)) {
            baseScore = 45;
        } else if (evaluation.has(TaskSlaCategory.DUE_TOMORROW)) {
            baseScore = 60;
        } else if (evaluation.has(TaskSlaCategory.DUE_IN_2_DAYS)) {
            baseScore = 75;
        } else if (evaluation.has(TaskSlaCategory.DUE_IN_3_DAYS)) {
            baseScore = 85;
        }

        int score = baseScore;
        if (evaluation.has(TaskSlaCategory.BLOCKED)) {
            score -= 20;
        }
        if (evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            score -= 25;
        }
        score = Math.max(0, Math.min(100, score));

        // Calculate riskLevel
        String riskLevel = "LOW";
        if (evaluation.has(TaskSlaCategory.OVERDUE_PENALTY) || score <= 20) {
            riskLevel = "CRITICAL";
        } else if (score <= 45) {
            riskLevel = "HIGH";
        } else if (score <= 75) {
            riskLevel = "MEDIUM";
        } else if (score < 100) {
            riskLevel = "LOW";
        } else if (score == 100) {
            if (evaluation.categories().size() == 1 && evaluation.has(TaskSlaCategory.NORMAL)) {
                riskLevel = "NORMAL";
            } else {
                riskLevel = "LOW";
            }
        }

        // Calculate reasons
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

        // Calculate recommended action
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
        String recommendedAction = actions.isEmpty() ? "No action required." : String.join(" ", actions);

        // Completed tasks are resolved only after they have valid accepted evidence.
        if (task.getStatus() == TaskStatus.DONE && !evaluation.has(TaskSlaCategory.MISSING_EVIDENCE)) {
            score = 100;
            riskLevel = "NORMAL";
            reasons = List.of("Task is resolved (DONE).");
            recommendedAction = "No action required.";
        }

        return new AssessmentResult(score, riskLevel, reasons, recommendedAction);
    }
}
