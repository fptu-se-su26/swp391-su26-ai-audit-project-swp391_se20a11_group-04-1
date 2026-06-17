package org.example.backend.entity;

public enum TaskReviewDecisionType {
    // Member asked leader to review the task before completion.
    REQUEST_REVIEW,

    // Leader accepted the reviewed task and moved it to DONE.
    APPROVED,

    // Leader returned the task to work with feedback.
    REJECTED
}
