package org.example.backend.repository;

import org.example.backend.entity.EmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
    List<EmailLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startedAt, LocalDateTime finishedAt);
}
