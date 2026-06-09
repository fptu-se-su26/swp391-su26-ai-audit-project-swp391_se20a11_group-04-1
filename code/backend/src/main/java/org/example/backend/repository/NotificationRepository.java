package org.example.backend.repository;

import org.example.backend.entity.NotificationEntityType;
import org.example.backend.entity.NotificationType;
import org.example.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientId);
    long countByRecipientIdAndIsReadFalse(Long recipientId);
    boolean existsByRecipientIdAndRelatedIdAndType(Long recipientId, Long relatedId, NotificationType type);
    boolean existsByRecipientIdAndRelatedIdAndTypeAndEntityTypeAndTitle(
            Long recipientId,
            Long relatedId,
            NotificationType type,
            NotificationEntityType entityType,
            String title
    );
}
