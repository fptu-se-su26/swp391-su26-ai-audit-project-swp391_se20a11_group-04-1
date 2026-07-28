package org.example.backend.repository;

import org.example.backend.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE LOWER(a.action) LIKE LOWER(CONCAT('%',:action,'%')) ORDER BY a.createdAt DESC")
    Page<AuditLog> findByActionContaining(@Param("action") String action, Pageable pageable);

    List<AuditLog> findTop5ByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<AuditLog> findTop10ByProjectIdOrderByCreatedAtDesc(Long projectId);

    @Query("SELECT DISTINCT a.projectId FROM AuditLog a WHERE a.emailSent = false AND a.projectId IS NOT NULL")
    List<Long> findDistinctProjectIdByEmailSentFalse();

    List<AuditLog> findByProjectIdAndEmailSentFalseOrderByCreatedAtAsc(Long projectId);
    
    List<AuditLog> findByProjectIdAndEmailSentFalseOrderByCreatedAtDesc(Long projectId);

    @Query("SELECT a FROM AuditLog a WHERE a.projectId = :projectId AND a.action NOT LIKE 'GET %' AND a.action NOT LIKE 'POST %' AND a.action NOT LIKE 'PUT %' AND a.action NOT LIKE 'DELETE %' AND a.action NOT LIKE 'PATCH %' ORDER BY a.createdAt DESC")
    List<AuditLog> findBusinessLogsByProjectId(@Param("projectId") Long projectId, Pageable pageable);

    long countByCreatedAtAfter(LocalDateTime after);

    long countByStatusAndCreatedAtAfter(String status, LocalDateTime after);

    @Query(value = """
            SELECT user_id, COUNT(*) AS fail_count
            FROM audit_logs
            WHERE status = 'FAILED'
              AND created_at > NOW() - INTERVAL '5 minutes'
              AND user_id IS NOT NULL
            GROUP BY user_id
            HAVING COUNT(*) > 10
            """, nativeQuery = true)
    List<Object[]> findSuspiciousUserIds();
}
