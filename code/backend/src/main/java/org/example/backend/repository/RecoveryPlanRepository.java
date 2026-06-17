package org.example.backend.repository;

import org.example.backend.entity.RecoveryPlan;
import org.example.backend.entity.RecoveryPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecoveryPlanRepository extends JpaRepository<RecoveryPlan, Long> {

    Optional<RecoveryPlan> findTopByProjectIdAndTaskIdOrderByCreatedAtDesc(Long projectId, Long taskId);

    List<RecoveryPlan> findByProjectIdAndTaskIdOrderByCreatedAtDesc(Long projectId, Long taskId);

    boolean existsByProjectIdAndTaskIdAndStatus(Long projectId, Long taskId, RecoveryPlanStatus status);

    boolean existsByProjectIdAndTaskIdAndStatusIn(Long projectId, Long taskId, Collection<RecoveryPlanStatus> statuses);

    Optional<RecoveryPlan> findTopByProjectIdAndTaskIdAndStatusInOrderByCreatedAtDesc(Long projectId, Long taskId, Collection<RecoveryPlanStatus> statuses);

    @Query("SELECT COUNT(rp) FROM RecoveryPlan rp WHERE rp.approvedBy = :userId")
    long countApprovedPlansByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(rp) FROM RecoveryPlan rp WHERE rp.rejectedBy = :userId")
    long countRejectedPlansByUserId(@Param("userId") Long userId);
}
