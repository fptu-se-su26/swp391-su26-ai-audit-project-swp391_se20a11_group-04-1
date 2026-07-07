package org.example.backend.repository;

import org.example.backend.entity.CodeInsightEvidenceLink;
import org.example.backend.entity.CodeInsightEvidenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CodeInsightEvidenceLinkRepository extends JpaRepository<CodeInsightEvidenceLink, Long> {
    boolean existsByProjectIdAndTaskIdAndEvidenceTypeAndEvidenceId(
            Long projectId,
            Long taskId,
            CodeInsightEvidenceType evidenceType,
            Long evidenceId);

    List<CodeInsightEvidenceLink> findByProjectIdAndEvidenceTypeAndEvidenceId(
            Long projectId,
            CodeInsightEvidenceType evidenceType,
            Long evidenceId);

    List<CodeInsightEvidenceLink> findByTaskId(Long taskId);

    List<CodeInsightEvidenceLink> findByProjectId(Long projectId);

    long countByProjectId(Long projectId);
}
