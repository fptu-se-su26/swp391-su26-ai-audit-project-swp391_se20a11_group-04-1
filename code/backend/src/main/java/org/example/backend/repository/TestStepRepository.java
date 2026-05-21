package org.example.backend.repository;

import org.example.backend.entity.TestStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestStepRepository extends JpaRepository<TestStep, Long> {
    List<TestStep> findByTestCaseIdOrderByStepNumberAsc(Long testCaseId);
    void deleteAllByTestCaseId(Long testCaseId);
}
