package org.example.backend.entity;

public enum TaskReviewDecisionType {
    // Member asked leader to review the task before completion.
    REQUEST_REVIEW,

    // Leader accepted the reviewed task and moved it to DONE.
    APPROVED,

    // Leader returned the task to work with feedback.
    REJECTED,

    // Leader reopened a completed task for another review pass.
    REOPENED_REVIEW,

    // Leader found a completed task needs rework.
    REQUESTED_REWORK
}
