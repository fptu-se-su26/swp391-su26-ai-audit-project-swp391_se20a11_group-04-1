package org.example.backend.entity;

public enum GithubWebhookProcessingStatus {
    // Event was accepted and stored, but normalization has not processed it yet.
    PENDING,

    // Future normalization worker completed successfully.
    PROCESSED,

    // Future normalization worker failed and stored error details.
    FAILED,

    // Event was intentionally ignored, for example unsupported GitHub event type.
    IGNORED
}
