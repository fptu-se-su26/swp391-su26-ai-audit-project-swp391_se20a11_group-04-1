package org.example.backend.repository;

import org.example.backend.entity.TestExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestExecutionRepository extends JpaRepository<TestExecution, Long> {

    // Idempotency check
    Optional<TestExecution> findByIdempotencyKey(String idempotencyKey);

    // Tránh N+1 khi fetch execution plan
    @Query("SELECT e FROM TestExecution e JOIN FETCH e.testCase tc " +
           "LEFT JOIN FETCH tc.steps " +
           "WHERE e.testRun.id = :testRunId ORDER BY e.orderIndex")
    List<TestExecution> findByTestRunIdWithTestCaseAndSteps(@Param("testRunId") Long testRunId);

    // Đếm theo status cho summary
    @Query("SELECT e.status, COUNT(e) FROM TestExecution e WHERE e.testRun.id = :testRunId GROUP BY e.status")
    List<Object[]> countByTestRunIdGroupByStatus(@Param("testRunId") Long testRunId);

    // Cho watchdog: update PENDING/RUNNING → ABORTED
    @Modifying
    @Query("UPDATE TestExecution e SET e.status = 'ABORTED', e.notes = :notes " +
           "WHERE e.testRun.id = :testRunId AND e.status IN ('PENDING', 'RUNNING')")
    int abortPendingAndRunningByTestRunId(
        @Param("testRunId") Long testRunId,
        @Param("notes") String notes
    );
}
