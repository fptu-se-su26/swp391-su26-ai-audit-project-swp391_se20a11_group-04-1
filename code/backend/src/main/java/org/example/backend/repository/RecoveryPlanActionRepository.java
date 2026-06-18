package org.example.backend.repository;

import org.example.backend.entity.RecoveryPlanAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecoveryPlanActionRepository extends JpaRepository<RecoveryPlanAction, Long> {

    List<RecoveryPlanAction> findByRecoveryPlanIdOrderByCreatedAtAsc(Long planId);

    boolean existsByIdempotencyKey(String idempotencyKey);
}
