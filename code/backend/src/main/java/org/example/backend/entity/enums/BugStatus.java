package org.example.backend.entity.enums;

/**
 * Lifecycle states of bug reports matching database enum values.
 * DRAFT  → Initial state; awaiting team discussion and leader approval.
 * OPEN   → Approved by leader; converted to Task and synced to GitHub.
 */
public enum BugStatus {
    DRAFT,
    OPEN,
    IN_PROGRESS,
    FIXED,
    VERIFIED,
    CLOSED,
    REOPENED
}
