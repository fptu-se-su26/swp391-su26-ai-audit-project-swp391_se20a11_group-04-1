package org.example.backend.service;

import org.example.backend.dto.NotificationResponse;
import org.example.backend.entity.NotificationEntityType;
import org.example.backend.entity.NotificationType;
import org.example.backend.entity.Project;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.example.backend.entity.UserAccount;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(Long userId);
    long getUnreadCount(Long userId);
    void markAsRead(Long notificationId, Long userId);
    void markAllAsRead(Long userId);
    NotificationResponse createAndPush(UserAccount recipient, Project project, NotificationEntityType entityType,
                                       Long relatedId, NotificationType type, String title, String message);
    void notifyTaskAssigned(Task task, UserAccount recipient, UserAccount actor, boolean actorIsProjectLeader);
    void notifyTaskReviewRequested(Task task, UserAccount requester, List<UserAccount> reviewers);
    void notifyTaskStatusChanged(Task task, TaskStatus oldStatus, TaskStatus newStatus);
}
