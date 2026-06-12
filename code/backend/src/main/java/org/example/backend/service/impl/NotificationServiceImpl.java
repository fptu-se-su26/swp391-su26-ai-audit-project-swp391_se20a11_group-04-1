package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.config.NotificationWebSocketHandler;
import org.example.backend.dto.NotificationResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.NotificationRepository;
import org.example.backend.repository.ProjectInvitationRepository;
import org.example.backend.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final ProjectInvitationRepository projectInvitationRepository;
    private final ObjectMapper objectMapper;

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

    @Override
    public NotificationResponse createAndPush(UserAccount recipient, Project project, NotificationEntityType entityType,
                                              Long relatedId, NotificationType type, String title, String message) {
        if (recipient == null) {
            return null;
        }

        Notification saved = notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .project(project)
                .entityType(entityType)
                .relatedId(relatedId)
                .type(type)
                .title(title)
                .message(message)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build());

        NotificationResponse response = mapToResponse(saved);
        pushToUser(recipient.getId(), response);
        return response;
    }

    @Override
    public void notifyTaskAssigned(Task task, UserAccount recipient, UserAccount actor, boolean actorIsProjectLeader) {
        String actorName = displayName(actor);
        String prefix = actorIsProjectLeader ? "Project Leader " : "";
        createAndPush(
                recipient,
                task.getProject(),
                NotificationEntityType.TASK,
                task.getId(),
                NotificationType.SYSTEM,
                "Bạn được giao task mới",
                prefix + actorName + " đã giao task \"" + task.getTitle() + "\" cho bạn."
        );
    }

    @Override
    public void notifyTaskReviewRequested(Task task, UserAccount requester, List<UserAccount> reviewers) {
        String requesterName = displayName(requester);
        for (UserAccount reviewer : reviewers) {
            if (reviewer == null || requester != null && reviewer.getId().equals(requester.getId())) {
                continue;
            }
            createAndPush(
                    reviewer,
                    task.getProject(),
                    NotificationEntityType.TASK,
                    task.getId(),
                    NotificationType.SYSTEM,
                    "Yêu cầu review task",
                    requesterName + " đã yêu cầu review task: " + task.getTitle()
            );
        }
    }

    @Override
    public void notifyTaskStatusChanged(Task task, TaskStatus oldStatus, TaskStatus newStatus) {
        UserAccount assignee = task.getPrimaryAssignee();
        if (assignee == null) {
            return;
        }

        if (newStatus == TaskStatus.DONE && oldStatus == TaskStatus.IN_REVIEW) {
            createAndPush(
                    assignee,
                    task.getProject(),
                    NotificationEntityType.TASK,
                    task.getId(),
                    NotificationType.SYSTEM,
                    "Task được phê duyệt",
                    "Task \"" + task.getTitle() + "\" đã được phê duyệt hoàn thành bởi Leader."
            );
        }

        if (newStatus == TaskStatus.IN_PROGRESS && oldStatus == TaskStatus.IN_REVIEW) {
            createAndPush(
                    assignee,
                    task.getProject(),
                    NotificationEntityType.TASK,
                    task.getId(),
                    NotificationType.SYSTEM,
                    "Review task thất bại",
                    "Task \"" + task.getTitle() + "\" đã bị từ chối phê duyệt. Vui lòng kiểm tra checklist để cập nhật thêm yêu cầu."
            );
        }
    }

    private void pushToUser(Long userId, NotificationResponse response) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "type", "NOTIFICATION",
                    "data", response
            ));
            NotificationWebSocketHandler.sendToUser(userId, payload);
        } catch (Exception e) {
            log.warn("Failed to push realtime notification to user {}", userId, e);
        }
    }

    private String displayName(UserAccount user) {
        if (user == null) {
            return "Một thành viên";
        }
        if (user.getProfile() != null && user.getProfile().getFullName() != null
                && !user.getProfile().getFullName().isBlank()) {
            return user.getProfile().getFullName();
        }
        return user.getUsername();
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
