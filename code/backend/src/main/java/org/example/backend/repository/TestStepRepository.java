package org.example.backend.repository;

import org.example.backend.entity.TestStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestStepRepository extends JpaRepository<TestStep, Long> {
    List<TestStep> findByTestCaseIdOrderByStepNumberAsc(Long testCaseId);

    @Modifying
    @Query("DELETE FROM TestStep s WHERE s.testCase.id = :testCaseId")
    void deleteAllByTestCaseId(@Param("testCaseId") Long testCaseId);
}
