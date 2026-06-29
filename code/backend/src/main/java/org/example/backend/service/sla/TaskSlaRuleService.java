package org.example.backend.service.sla;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;

@Service
@RequiredArgsConstructor
public class TaskSlaRuleService {

    private final TaskSlaPauseService taskSlaPauseService;
    private final Clock clock;

    public TaskSlaEvaluation evaluate(Task task) {
        EnumSet<TaskSlaCategory> categories = EnumSet.noneOf(TaskSlaCategory.class);
        LocalDate today = LocalDate.now(clock);
        long overdueDays = calculateOverdueDays(task, today);

        if (task.getStatus() == TaskStatus.BLOCKED) {
            categories.add(TaskSlaCategory.BLOCKED);
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
        if (penaltyDeadlineBreached && task.getStatus() != TaskStatus.DONE) {
            categories.add(TaskSlaCategory.OVERDUE_PENALTY);
        }

        if (categories.isEmpty()) {
            categories.add(TaskSlaCategory.NORMAL);
        }

        return new TaskSlaEvaluation(categories, overdueDays);
    }

    private long calculateOverdueDays(Task task, LocalDate today) {
        return taskSlaPauseService.calculateEffectiveOverdueDays(task, today);
    }
}
