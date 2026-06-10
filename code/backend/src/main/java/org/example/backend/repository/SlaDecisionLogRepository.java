package org.example.backend.repository;

import org.example.backend.entity.SlaDecisionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SlaDecisionLogRepository extends JpaRepository<SlaDecisionLog, Long> {
    List<SlaDecisionLog> findTop5ByTaskIdAndProjectIdOrderByEvaluatedAtDesc(Long taskId, Long projectId);
    List<SlaDecisionLog> findByProjectIdOrderByEvaluatedAtDesc(Long projectId);
    List<SlaDecisionLog> findByProjectIdAndTaskIdOrderByEvaluatedAtDesc(Long projectId, Long taskId);
}
