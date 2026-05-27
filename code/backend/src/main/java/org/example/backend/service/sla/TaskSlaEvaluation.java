package org.example.backend.service.sla;

import java.util.EnumSet;

public record TaskSlaEvaluation(
        EnumSet<TaskSlaCategory> categories,
        long overdueDays,
        boolean hasAcceptedEvidence
) {
    public boolean has(TaskSlaCategory category) {
        return categories.contains(category);
    }
}
