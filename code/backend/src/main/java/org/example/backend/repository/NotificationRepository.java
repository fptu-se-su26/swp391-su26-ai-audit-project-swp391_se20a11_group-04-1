package org.example.backend.repository;

import org.example.backend.entity.NotificationEntityType;
import org.example.backend.entity.NotificationType;
import org.example.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :recipientId " +
           "ORDER BY CASE WHEN CAST(n.type AS string) = 'MENTOR_ANNOUNCEMENT' THEN 1 ELSE 2 END, n.createdAt DESC")
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(@Param("recipientId") Long recipientId);

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :recipientId AND n.isRead = false " +
           "ORDER BY CASE WHEN CAST(n.type AS string) = 'MENTOR_ANNOUNCEMENT' THEN 1 ELSE 2 END, n.createdAt DESC")
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(@Param("recipientId") Long recipientId);
    
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
