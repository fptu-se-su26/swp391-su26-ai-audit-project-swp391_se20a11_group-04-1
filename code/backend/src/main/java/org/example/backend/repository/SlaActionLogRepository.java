package org.example.backend.repository;

import org.example.backend.entity.SlaActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SlaActionLogRepository extends JpaRepository<SlaActionLog, Long> {
    boolean existsByActionKey(String actionKey);
    Optional<SlaActionLog> findByActionKey(String actionKey);
    List<SlaActionLog> findTop5ByTaskIdAndProjectIdOrderByCreatedAtDesc(Long taskId, Long projectId);
    List<SlaActionLog> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    @Query("SELECT COUNT(s) FROM SlaActionLog s WHERE s.recipientId = :userId")
    long countActionsByRecipientId(@Param("userId") Long userId);

    @Query("SELECT COUNT(s) FROM SlaActionLog s WHERE s.recipientId = :userId AND s.slaCategory = 'OVERDUE_SHORT'")
    long countWarningsByRecipientId(@Param("userId") Long userId);
}
