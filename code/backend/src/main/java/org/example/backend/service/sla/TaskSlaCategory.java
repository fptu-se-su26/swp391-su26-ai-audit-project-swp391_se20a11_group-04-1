package org.example.backend.service.sla;

public enum TaskSlaCategory {
    NORMAL,
    DUE_IN_3_DAYS,
    DUE_IN_2_DAYS,
    DUE_TOMORROW,
    DUE_TODAY,
    DUE_SOON,
    OVERDUE_SHORT,
    OVERDUE_PENALTY,
    BLOCKED,
    MISSING_EVIDENCE
}
