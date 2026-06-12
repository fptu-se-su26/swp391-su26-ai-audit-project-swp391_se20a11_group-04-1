package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.EvidenceEntityType;
import org.example.backend.entity.EvidenceStatus;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.example.backend.repository.EvidenceLinkRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;

@Service
@RequiredArgsConstructor
public class TaskSlaRuleService {

    private final EvidenceLinkRepository evidenceLinkRepository;
    private final Clock clock;

    public TaskSlaEvaluation evaluate(Task task) {
        return evaluate(task, hasAcceptedEvidence(task));
    }

    public TaskSlaEvaluation evaluate(Task task, boolean hasAcceptedEvidence) {
        EnumSet<TaskSlaCategory> categories = EnumSet.noneOf(TaskSlaCategory.class);
        LocalDate today = LocalDate.now(clock);
        long overdueDays = calculateOverdueDays(task, today);

        if (task.getStatus() == TaskStatus.BLOCKED) {
            categories.add(TaskSlaCategory.BLOCKED);
        }

        if (task.getStatus() == TaskStatus.DONE && !hasAcceptedEvidence) {
            categories.add(TaskSlaCategory.MISSING_EVIDENCE);
        }

        if (task.getDeadline() != null && task.getStatus() != TaskStatus.DONE) {
            long daysUntilDeadline = ChronoUnit.DAYS.between(today, task.getDeadline());
            if (daysUntilDeadline >= 0 && daysUntilDeadline <= 3) {
                categories.add(TaskSlaCategory.DUE_SOON); // Backward compatibility
                if (daysUntilDeadline == 0) {
                    categories.add(TaskSlaCategory.DUE_TODAY);
                } else if (daysUntilDeadline == 1) {
                    categories.add(TaskSlaCategory.DUE_TOMORROW);
                } else if (daysUntilDeadline == 2) {
                    categories.add(TaskSlaCategory.DUE_IN_2_DAYS);
                } else if (daysUntilDeadline == 3) {
                    categories.add(TaskSlaCategory.DUE_IN_3_DAYS);
                }
            }
            if (overdueDays >= 1 && overdueDays <= 2) {
                categories.add(TaskSlaCategory.OVERDUE_SHORT);
            }
        }

        boolean penaltyDeadlineBreached = task.getDeadline() != null
                && overdueDays >= 3;
        boolean incompleteOrMissingEvidence = task.getStatus() != TaskStatus.DONE || !hasAcceptedEvidence;
        if (penaltyDeadlineBreached && incompleteOrMissingEvidence) {
            categories.add(TaskSlaCategory.OVERDUE_PENALTY);
        }

        if (categories.isEmpty()) {
            categories.add(TaskSlaCategory.NORMAL);
        }

        return new TaskSlaEvaluation(categories, overdueDays, hasAcceptedEvidence);
    }

    private boolean hasAcceptedEvidence(Task task) {
        if (task.getId() == null) {
            return false;
        }
        return evidenceLinkRepository.existsAcceptedEvidenceForEntity(
                EvidenceEntityType.TASK,
                task.getId(),
                EvidenceStatus.ACCEPTED
        );
    }

    private long calculateOverdueDays(Task task, LocalDate today) {
        if (task.getDeadline() == null || !today.isAfter(task.getDeadline())) {
            return 0;
        }
        return ChronoUnit.DAYS.between(task.getDeadline(), today);
    }
}
