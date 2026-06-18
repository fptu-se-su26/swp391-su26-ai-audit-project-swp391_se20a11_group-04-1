package org.example.backend.service;

import org.example.backend.dto.NotificationResponse;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.Project;
import org.example.backend.entity.NotificationEntityType;
import org.example.backend.entity.NotificationType;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(Long userId);
    long getUnreadCount(Long userId);
    void markAsRead(Long notificationId, Long userId);
    void markAllAsRead(Long userId);
    void createAndPush(
        UserAccount recipient,
        Project project,
        NotificationEntityType entityType,
        Long relatedId,
        NotificationType type,
        String title,
        String message
    );
    boolean hasAlreadyNotified(
        Long userId,
        Long entityId,
        NotificationType type,
        NotificationEntityType entityType,
        String title
    );
}
