package org.example.backend.entity.enums;

/**
 * Lifecycle states of bug reports matching database enum values.
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
