package org.example.backend.repository;

import org.example.backend.entity.TestRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestRunRepository extends JpaRepository<TestRun, String> {

    List<TestRun> findByTestCaseIdOrderByStartedAtDesc(Long testCaseId);

    @Query("""
        SELECT tr FROM TestRun tr
        WHERE tr.testCaseId = :testCaseId
        ORDER BY tr.startedAt DESC
        LIMIT :limit
    """)
    List<TestRun> findRecentByTestCaseId(
        @Param("testCaseId") Long testCaseId,
        @Param("limit") int limit
    );

    long countByTestCaseIdAndStatus(Long testCaseId, String status);
}
