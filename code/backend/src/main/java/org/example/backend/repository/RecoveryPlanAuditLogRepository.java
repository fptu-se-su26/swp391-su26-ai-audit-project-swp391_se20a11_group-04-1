package org.example.backend.repository;

import org.example.backend.entity.RecoveryPlanAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecoveryPlanAuditLogRepository extends JpaRepository<RecoveryPlanAuditLog, Long> {

    List<RecoveryPlanAuditLog> findByRecoveryPlanIdOrderByCreatedAtAsc(Long recoveryPlanId);

    List<RecoveryPlanAuditLog> findByProjectIdAndTaskIdOrderByCreatedAtDesc(Long projectId, Long taskId);
}
