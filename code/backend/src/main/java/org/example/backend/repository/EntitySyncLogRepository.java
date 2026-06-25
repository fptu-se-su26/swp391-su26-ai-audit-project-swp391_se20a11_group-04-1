package org.example.backend.repository;

import org.example.backend.entity.EntitySyncLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface EntitySyncLogRepository extends JpaRepository<EntitySyncLog, Long> {
    
    Page<EntitySyncLog> findByStatusIn(List<String> statuses, Pageable pageable);
    
    @Query("SELECT e FROM EntitySyncLog e WHERE e.status = 'RETRY_PENDING' AND e.nextRetryAt <= :now")
    List<EntitySyncLog> findRetryPending(@Param("now") LocalDateTime now);
    
    long countByStatus(String status);
}
