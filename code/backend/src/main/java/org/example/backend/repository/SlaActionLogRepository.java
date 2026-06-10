package org.example.backend.repository;

import org.example.backend.entity.SlaActionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SlaActionLogRepository extends JpaRepository<SlaActionLog, Long> {
    boolean existsByActionKey(String actionKey);
    Optional<SlaActionLog> findByActionKey(String actionKey);
    List<SlaActionLog> findTop5ByTaskIdAndProjectIdOrderByCreatedAtDesc(Long taskId, Long projectId);
    List<SlaActionLog> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
