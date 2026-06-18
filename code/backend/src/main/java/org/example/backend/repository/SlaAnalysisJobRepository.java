package org.example.backend.repository;

import org.example.backend.entity.SlaAnalysisJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SlaAnalysisJobRepository extends JpaRepository<SlaAnalysisJob, Long> {
    Optional<SlaAnalysisJob> findFirstByProjectIdAndSprintIdAndStatusInOrderByCreatedAtDesc(
        Long projectId, Long sprintId, List<String> statuses);
}
