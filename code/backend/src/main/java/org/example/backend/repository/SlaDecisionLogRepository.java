package org.example.backend.repository;

import org.example.backend.entity.SlaDecisionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SlaDecisionLogRepository extends JpaRepository<SlaDecisionLog, Long> {
    List<SlaDecisionLog> findTop5ByTaskIdAndProjectIdOrderByEvaluatedAtDesc(Long taskId, Long projectId);
    List<SlaDecisionLog> findByProjectIdOrderByEvaluatedAtDesc(Long projectId);
    List<SlaDecisionLog> findByProjectIdAndTaskIdOrderByEvaluatedAtDesc(Long projectId, Long taskId);

    @Query("""
            SELECT d FROM SlaDecisionLog d
            WHERE d.projectId = :projectId AND d.sprintId = :sprintId
            ORDER BY d.task.id ASC, d.evaluatedAt ASC
            """)
    List<SlaDecisionLog> findByProjectAndSprintOrdered(
            @Param("projectId") Long projectId,
            @Param("sprintId") Long sprintId);
}
