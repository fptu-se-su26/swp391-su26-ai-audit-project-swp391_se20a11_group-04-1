package org.example.backend.repository;

import org.example.backend.entity.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long>, JpaSpecificationExecutor<Evidence> {
    @Query("SELECT COUNT(e) FROM Evidence e JOIN e.evidenceLinks l WHERE l.entityType = :entityType AND l.entityId = :entityId")
    int countByEntityTypeAndEntityId(@Param("entityType") org.example.backend.entity.EvidenceEntityType entityType, @Param("entityId") Long entityId);

    @Query("SELECT COUNT(e) FROM Evidence e WHERE e.uploadedBy.id = :userId")
    long countByUploadedByUserId(@Param("userId") Long userId);
}
