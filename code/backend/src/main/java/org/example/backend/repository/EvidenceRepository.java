package org.example.backend.repository;

import org.example.backend.entity.Evidence;
import org.example.backend.entity.EvidenceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface EvidenceRepository extends JpaRepository<Evidence, Long>, JpaSpecificationExecutor<Evidence> {
    long countByProjectId(Long projectId);

    long countByProjectIdAndStatus(Long projectId, EvidenceStatus status);
}
