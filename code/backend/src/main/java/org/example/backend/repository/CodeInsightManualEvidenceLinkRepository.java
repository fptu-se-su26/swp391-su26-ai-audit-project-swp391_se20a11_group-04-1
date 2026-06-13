package org.example.backend.repository;

import org.example.backend.entity.CodeInsightEvidenceType;
import org.example.backend.entity.CodeInsightManualEvidenceLink;
import org.example.backend.entity.CodeInsightManualEvidenceLinkStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CodeInsightManualEvidenceLinkRepository extends JpaRepository<CodeInsightManualEvidenceLink, Long> {
    List<CodeInsightManualEvidenceLink> findByTaskIdOrderByCreatedAtDesc(Long taskId);

    List<CodeInsightManualEvidenceLink> findByTaskIdAndStatus(Long taskId, CodeInsightManualEvidenceLinkStatus status);

    List<CodeInsightManualEvidenceLink> findByProjectId(Long projectId);

    Optional<CodeInsightManualEvidenceLink> findByProjectIdAndTaskIdAndEvidenceTypeAndEvidenceId(
            Long projectId,
            Long taskId,
            CodeInsightEvidenceType evidenceType,
            Long evidenceId);
}
