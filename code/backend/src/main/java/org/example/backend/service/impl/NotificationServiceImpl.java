package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.NotificationResponse;
import org.example.backend.entity.Notification;
import org.example.backend.exception.CustomException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.NotificationRepository;
import org.example.backend.repository.ProjectInvitationRepository;
import org.example.backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final ProjectInvitationRepository projectInvitationRepository;

    @Override
    public List<NotificationResponse> getMyNotifications(Long userId) {
        log.info("Fetching notifications for user ID: {} from DB", userId);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Thông báo không tồn tại."));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new CustomException("Bạn không có quyền đánh dấu thông báo này.", HttpStatus.FORBIDDEN);
        }

        notification.setRead(true);
        notificationRepository.save(notification);
        log.info("Marked notification {} as read for user {} in DB", notificationId, userId);
    }

    @Override
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
        log.info("Marked all {} unread notifications as read for user {} in DB", unread.size(), userId);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        String invitationStatus = null;
        if (notification.getType() == org.example.backend.entity.NotificationType.INVITATION && notification.getRelatedId() != null) {
            invitationStatus = projectInvitationRepository.findById(notification.getRelatedId())
                    .map(inv -> inv.getStatus().name())
                    .orElse(null);
        }

        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType().name())
                .relatedId(notification.getRelatedId())
                .projectId(notification.getProject() != null ? notification.getProject().getId() : null)
                .entityType(notification.getEntityType() != null ? notification.getEntityType().name() : null)
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .invitationStatus(invitationStatus)
                .build();
    }
}