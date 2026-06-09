package org.example.backend.repository;

import org.example.backend.entity.TestRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TestRunRepository extends JpaRepository<TestRun, Long> {

    @Query("SELECT DISTINCT tr FROM TestRun tr JOIN TestExecution te ON te.testRun = tr WHERE te.testCase.id = :testCaseId AND tr.isSaved = true ORDER BY tr.startedAt DESC")
    List<TestRun> findByTestCaseIdAndIsSavedTrueOrderByStartedAtDesc(@Param("testCaseId") Long testCaseId);

    @Query("""
        SELECT DISTINCT tr FROM TestRun tr
        JOIN TestExecution te ON te.testRun = tr
        WHERE te.testCase.id = :testCaseId
        ORDER BY tr.startedAt DESC
        LIMIT :limit
    """)
    List<TestRun> findRecentByTestCaseId(
        @Param("testCaseId") Long testCaseId,
        @Param("limit") int limit
    );

    @Query("SELECT COUNT(DISTINCT tr) FROM TestRun tr JOIN TestExecution te ON te.testRun = tr WHERE te.testCase.id = :testCaseId AND tr.status = :status")
    long countByTestCaseIdAndStatus(@Param("testCaseId") Long testCaseId, @Param("status") org.example.backend.entity.enums.TestRunStatus status);

    List<TestRun> findByIsSavedFalseAndCreatedAtBefore(LocalDateTime cutoff);

    // Watchdog query — dùng partial index idx_test_runs_running_updated
    @Query("SELECT r FROM TestRun r JOIN FETCH r.createdBy " +
           "WHERE r.status = 'RUNNING' AND r.updatedAt < :cutoff")
    List<TestRun> findStaleRunningTestRuns(@Param("cutoff") LocalDateTime cutoff);

    // Atomic increment — KHÔNG đọc-modify-write trong Java
    @Modifying
    @Query("UPDATE TestRun r SET r.completedCount = r.completedCount + 1 WHERE r.id = :id")
    int incrementCompletedCount(@Param("id") Long id);
}
