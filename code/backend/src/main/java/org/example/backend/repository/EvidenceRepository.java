package org.example.backend.repository;

import org.example.backend.entity.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long>, JpaSpecificationExecutor<Evidence> {
    @Query("SELECT COUNT(e) FROM Evidence e JOIN e.evidenceLinks l WHERE l.entityType = 'TASK' AND l.entityId = :taskId")
    int countByTaskId(@Param("taskId") Long taskId);
}
