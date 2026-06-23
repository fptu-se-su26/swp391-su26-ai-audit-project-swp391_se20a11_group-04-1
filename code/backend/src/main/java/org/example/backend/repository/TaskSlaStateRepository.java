package org.example.backend.repository;

import org.example.backend.entity.TaskSlaState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskSlaStateRepository extends JpaRepository<TaskSlaState, Long> {
    Optional<TaskSlaState> findByTaskIdAndProjectId(Long taskId, Long projectId);
    List<TaskSlaState> findByProjectIdOrderByEvaluatedAtDesc(Long projectId);
    List<TaskSlaState> findByProjectIdAndCurrentRiskLevelOrderByEvaluatedAtDesc(Long projectId, String currentRiskLevel);

    @Query("SELECT s FROM TaskSlaState s " +
           "JOIN FETCH s.task t " +
           "LEFT JOIN FETCH t.primaryAssignee a " +
           "LEFT JOIN FETCH a.profile " +
           "WHERE s.projectId = :projectId AND s.sprintId = :sprintId " +
           "ORDER BY s.currentScore ASC")
    List<TaskSlaState> findByProjectIdAndSprintIdWithTask(
            @Param("projectId") Long projectId,
            @Param("sprintId") Long sprintId);
}
