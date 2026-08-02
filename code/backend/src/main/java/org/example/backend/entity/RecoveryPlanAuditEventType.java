package org.example.backend.entity;

public enum RecoveryPlanAuditEventType {
    PLAN_GENERATED,
    PLAN_UPDATED,
    PLAN_APPROVED,
    PLAN_REJECTED,
    PLAN_EXECUTION_STARTED,
    PLAN_EXECUTED,
    PLAN_FAILED,
    ACTION_EXECUTED,
    ACTION_SKIPPED,
    ACTION_FAILED
}
