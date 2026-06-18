package org.example.backend.repository;

import org.example.backend.entity.TestCase;
import org.example.backend.entity.enums.TestCaseStatus;
import org.example.backend.entity.enums.TestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {
    
    @Query(value = "SELECT MAX(project_sub_id) FROM test_cases WHERE project_id = :projectId", nativeQuery = true)
    Integer findMaxProjectSubIdByProjectId(@Param("projectId") Long projectId);

    @Query("""
        SELECT tc FROM TestCase tc
        WHERE tc.projectId = :projectId
        AND (CAST(:status AS string) IS NULL OR tc.status = :status)
        AND (CAST(:type AS string) IS NULL OR tc.type = :type)
        AND (:requirementId IS NULL OR tc.requirementId = :requirementId)
    """)
    Page<TestCase> findByProjectWithFilters(
        @Param("projectId") Long projectId,
        @Param("status") TestCaseStatus status,
        @Param("type") TestType type,
        @Param("requirementId") Long requirementId,
        Pageable pageable
    );

    Optional<TestCase> findByIdAndProjectId(Long id, Long projectId);
    // --- Playwright / Automation methods ---
    @Modifying
    @Query("UPDATE TestCase tc SET tc.cachedPlaywrightScript = :script, tc.scriptSource = :source, tc.scriptGeneratedAt = CURRENT_TIMESTAMP WHERE tc.id = :id")
    void updateScriptCache(@Param("id") Long id, @Param("script") String script, @Param("source") String source);

    @Modifying
    @Query("UPDATE TestCase tc SET tc.lastRunStatus = :status, tc.lastRunId = :runId, tc.lastRunAt = CURRENT_TIMESTAMP, tc.runCount = tc.runCount + 1 WHERE tc.id = :id")
    void updateLastRunInfo(@Param("id") Long id, @Param("status") String status, @Param("runId") String runId);
}
