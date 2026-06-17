package org.example.backend.repository;

import org.example.backend.entity.ApiTestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiTestResultRepository extends JpaRepository<ApiTestResult, Long> {
    List<ApiTestResult> findByTestCaseIdAndIsSavedTrueOrderByExecutedAtDesc(Long testCaseId);
    
    Optional<ApiTestResult> findByIdAndTestCaseId(Long id, Long testCaseId);

    Optional<ApiTestResult> findFirstByTestCaseIdOrderByExecutedAtDesc(Long testCaseId);

    Optional<ApiTestResult> findByAgentTaskId(UUID agentTaskId);
}
