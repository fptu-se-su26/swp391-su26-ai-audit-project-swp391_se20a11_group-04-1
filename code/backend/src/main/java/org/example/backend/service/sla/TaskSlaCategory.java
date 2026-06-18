package org.example.backend.service.sla;

public enum TaskSlaCategory {
    NORMAL,
    DUE_SOON,
    DUE_TODAY,
    DUE_TOMORROW,
    DUE_IN_2_DAYS,
    DUE_IN_3_DAYS,
    OVERDUE_SHORT,
    OVERDUE_PENALTY,
    OVERDUE_FROZEN,
    BLOCKED,
    MISSING_EVIDENCE
}
