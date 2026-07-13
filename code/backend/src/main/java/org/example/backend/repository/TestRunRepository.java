package org.example.backend.repository;

import org.example.backend.entity.TestRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TestRunRepository extends JpaRepository<TestRun, Long> {

    @Query(value = "SELECT DISTINCT tr FROM TestRun tr JOIN TestExecution te ON te.testRun = tr WHERE te.testCase.id = :testCaseId AND tr.isSaved = true ORDER BY tr.startedAt DESC",
           countQuery = "SELECT COUNT(DISTINCT tr) FROM TestRun tr JOIN TestExecution te ON te.testRun = tr WHERE te.testCase.id = :testCaseId AND tr.isSaved = true")
    Page<TestRun> findByTestCaseIdAndIsSavedTrueOrderByStartedAtDesc(@Param("testCaseId") Long testCaseId, Pageable pageable);

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

    // Xử lý Bug 2: Clear Persistence Context sau khi Atomic increment để findById tiếp theo luôn đọc mới nhất từ DB
    @Modifying(clearAutomatically = true)
    @Query("UPDATE TestRun r SET r.completedCount = r.completedCount + 1, r.updatedAt = :now WHERE r.id = :id")
    int incrementCompletedCount(@Param("id") Long id, @Param("now") LocalDateTime now);

    // Xử lý Bug 2: Method đọc lại completedCount vừa được update
    @Query("SELECT r.completedCount FROM TestRun r WHERE r.id = :id")
    int getCompletedCount(@Param("id") Long id);
}
