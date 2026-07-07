package org.example.backend.repository;

import org.example.backend.entity.CodeInsightEvidenceType;
import org.example.backend.entity.ManualEvidenceLink;
import org.example.backend.entity.ManualEvidenceLinkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManualEvidenceLinkRepository extends JpaRepository<ManualEvidenceLink, Long> {
    List<ManualEvidenceLink> findByTaskIdOrderByCreatedAtDesc(Long taskId);

    List<ManualEvidenceLink> findByTaskIdAndStatus(Long taskId, ManualEvidenceLinkStatus status);

    List<ManualEvidenceLink> findByProjectId(Long projectId);

    long countByProjectId(Long projectId);

    Optional<ManualEvidenceLink> findByProjectIdAndTaskIdAndEvidenceTypeAndEvidenceId(
            Long projectId,
            Long taskId,
            CodeInsightEvidenceType evidenceType,
            Long evidenceId);
}
