package org.example.backend.repository;

import org.example.backend.entity.OutboxEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findTop50ByStatusOrderByCreatedAtAsc(String status);

    @Query("""
            select e
            from OutboxEvent e
            where e.status = 'PENDING'
               or (e.status = 'FAILED'
                   and e.retryCount < :maxRetries
                   and (e.nextRetryAt is null or e.nextRetryAt <= :now))
            order by e.createdAt asc
            """)
    List<OutboxEvent> findPublishableEvents(LocalDateTime now, int maxRetries, Pageable pageable);
}
