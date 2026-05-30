package org.example.backend.repository;

import org.example.backend.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findTop50ByStatusOrderByCreatedAtAsc(String status);

    List<OutboxEvent> findTop50ByStatusAndRetryCountGreaterThanOrderByCreatedAtAsc(String status, int retryCount);

    long countByStatus(String status);

    long countByStatusAndPublishedAtAfter(String status, LocalDateTime publishedAt);

    Optional<OutboxEvent> findTopByStatusOrderByCreatedAtDesc(String status);

    List<OutboxEvent> findTop12ByOrderByCreatedAtDesc();

    List<OutboxEvent> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startedAt, LocalDateTime finishedAt);
}
