package org.example.backend.repository;

import org.example.backend.entity.TaskSlaState;
import org.example.backend.entity.TaskStatus;
import org.example.backend.entity.RecoveryPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskSlaStateRepository extends JpaRepository<TaskSlaState, Long> {
    Optional<TaskSlaState> findByTaskIdAndProjectId(Long taskId, Long projectId);
    List<TaskSlaState> findByProjectIdOrderByEvaluatedAtDesc(Long projectId);
    List<TaskSlaState> findByProjectIdAndCurrentRiskLevelOrderByEvaluatedAtDesc(Long projectId, String currentRiskLevel);

    @Query("""
            SELECT s FROM TaskSlaState s
            JOIN FETCH s.task t
            WHERE UPPER(s.currentRiskLevel) IN :riskLevels
            AND t.status <> :doneStatus
            ORDER BY s.evaluatedAt DESC
            """)
    List<TaskSlaState> findRecoveryPlanBackfillCandidates(
            @Param("riskLevels") List<String> riskLevels,
            @Param("doneStatus") TaskStatus doneStatus,
            Pageable pageable);

    @Query("""
            SELECT s FROM TaskSlaState s
            JOIN FETCH s.task t
            WHERE s.projectId = :projectId
            AND (:sprintId IS NULL OR s.sprintId = :sprintId)
            AND UPPER(s.currentRiskLevel) IN :riskLevels
            AND t.status <> :doneStatus
            AND NOT EXISTS (
                SELECT 1 FROM RecoveryPlan rp
                WHERE rp.projectId = s.projectId
                AND rp.taskId = s.taskId
                AND rp.status IN :activeStatuses
            )
            ORDER BY s.evaluatedAt DESC
            """)
    List<TaskSlaState> findProjectRecoveryPlanCandidates(
            @Param("projectId") Long projectId,
            @Param("sprintId") Long sprintId,
            @Param("riskLevels") List<String> riskLevels,
            @Param("doneStatus") TaskStatus doneStatus,
            @Param("activeStatuses") List<RecoveryPlanStatus> activeStatuses);

    @Query("""
            SELECT s FROM TaskSlaState s
            JOIN FETCH s.task t
            LEFT JOIN FETCH t.primaryAssignee a
            LEFT JOIN FETCH a.profile
            WHERE s.projectId = :projectId
            AND (:sprintId IS NULL OR s.sprintId = :sprintId)
            AND UPPER(s.currentRiskLevel) IN :riskLevels
            AND t.status <> :doneStatus
            ORDER BY s.evaluatedAt DESC
            """)
    List<TaskSlaState> findProjectRecoveryReviewTasks(
            @Param("projectId") Long projectId,
            @Param("sprintId") Long sprintId,
            @Param("riskLevels") List<String> riskLevels,
            @Param("doneStatus") TaskStatus doneStatus);

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
