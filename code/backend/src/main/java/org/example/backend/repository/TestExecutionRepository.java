package org.example.backend.repository;

import org.example.backend.entity.TestExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for TestExecution.
 */
@Repository
public interface TestExecutionRepository extends JpaRepository<TestExecution, Long> {
}
