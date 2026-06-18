package org.example.backend.repository;

import org.example.backend.entity.BugReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for BugReport.
 */
@Repository
public interface BugReportRepository extends JpaRepository<BugReport, Long> {
    List<BugReport> findByProjectId(Long projectId);
    List<BugReport> findByAssignedToId(Long userId);
    
    // Core query method supporting the reverse-sync from Task to BugReport
    Optional<BugReport> findByRelatedTaskId(Long taskId);
}
