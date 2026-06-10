package org.example.backend.repository;

import org.example.backend.entity.TaskSlaState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskSlaStateRepository extends JpaRepository<TaskSlaState, Long> {
    Optional<TaskSlaState> findByTaskIdAndProjectId(Long taskId, Long projectId);
    List<TaskSlaState> findByProjectIdOrderByEvaluatedAtDesc(Long projectId);
    List<TaskSlaState> findByProjectIdAndCurrentRiskLevelOrderByEvaluatedAtDesc(Long projectId, String currentRiskLevel);
}
