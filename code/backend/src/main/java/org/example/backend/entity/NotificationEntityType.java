package org.example.backend.entity;

/**
 * Defines the type of entity related to a notification.
 * Helps the frontend route to the correct page when clicking the notification.
 */
public enum NotificationEntityType {
    PROJECT_INVITATION,
    TASK,
    BUG_REPORT,
    REQUIREMENT,
    WEEKLY_REPORT
}
