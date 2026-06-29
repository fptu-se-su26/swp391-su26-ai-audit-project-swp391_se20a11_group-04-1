package org.example.backend.repository;

import jakarta.persistence.LockModeType;
import org.example.backend.entity.RecoveryPlan;
import org.example.backend.entity.RecoveryPlanSource;
import org.example.backend.entity.RecoveryPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface RecoveryPlanRepository extends JpaRepository<RecoveryPlan, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT rp FROM RecoveryPlan rp WHERE rp.id = :id")
    Optional<RecoveryPlan> findByIdForUpdate(@Param("id") Long id);

    Optional<RecoveryPlan> findTopByProjectIdAndTaskIdOrderByCreatedAtDesc(Long projectId, Long taskId);

    List<RecoveryPlan> findByProjectIdAndTaskIdOrderByCreatedAtDesc(Long projectId, Long taskId);

    boolean existsByProjectIdAndTaskIdAndStatus(Long projectId, Long taskId, RecoveryPlanStatus status);

    boolean existsByProjectIdAndTaskIdAndStatusIn(Long projectId, Long taskId, Collection<RecoveryPlanStatus> statuses);

    boolean existsByProjectIdAndTaskIdAndGeneratedSourceAndCreatedAtAfter(
            Long projectId, Long taskId, RecoveryPlanSource generatedSource, LocalDateTime createdAt);

    boolean existsByProjectIdAndTaskIdAndGeneratedSourceAndFollowUpTrueAndCreatedAtAfter(
            Long projectId, Long taskId, RecoveryPlanSource generatedSource, LocalDateTime createdAt);

    long countByProjectIdAndTaskId(Long projectId, Long taskId);

    @Query("""
            SELECT COUNT(rp) FROM RecoveryPlan rp
            WHERE rp.projectId = :projectId
            AND rp.taskId = :taskId
            AND rp.generatedSource = :generatedSource
            AND ((:sprintId IS NULL AND rp.sprintId IS NULL) OR rp.sprintId = :sprintId)
            """)
    int countByProjectIdAndTaskIdAndGeneratedSourceAndSprintId(
            @Param("projectId") Long projectId,
            @Param("taskId") Long taskId,
            @Param("generatedSource") RecoveryPlanSource generatedSource,
            @Param("sprintId") Long sprintId);

    Optional<RecoveryPlan> findTopByProjectIdAndTaskIdAndStatusInOrderByCreatedAtDesc(Long projectId, Long taskId, Collection<RecoveryPlanStatus> statuses);

    @Query("SELECT COUNT(rp) FROM RecoveryPlan rp WHERE rp.approvedBy = :userId")
    long countApprovedPlansByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(rp) FROM RecoveryPlan rp WHERE rp.rejectedBy = :userId")
    long countRejectedPlansByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT rp FROM RecoveryPlan rp
            WHERE rp.status = org.example.backend.entity.RecoveryPlanStatus.EXECUTED
            AND rp.executedAt <= :cutoff
            AND rp.effectivenessCheckedAt IS NULL
            """)
    List<RecoveryPlan> findExecutedWithoutEffectivenessCheck(@Param("cutoff") LocalDateTime cutoff);

    List<RecoveryPlan> findByProjectIdAndStatusInOrderByCreatedAtDesc(Long projectId, Collection<RecoveryPlanStatus> statuses);

    List<RecoveryPlan> findByProjectIdAndSprintIdAndStatusInOrderByCreatedAtDesc(Long projectId, Long sprintId, Collection<RecoveryPlanStatus> statuses);
}
