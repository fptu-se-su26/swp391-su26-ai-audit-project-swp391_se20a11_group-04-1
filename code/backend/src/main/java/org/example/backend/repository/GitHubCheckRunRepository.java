package org.example.backend.repository;

import org.example.backend.entity.GitHubCheckRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GitHubCheckRunRepository extends JpaRepository<GitHubCheckRun, Long> {
    Optional<GitHubCheckRun> findByIntegrationIdAndEventTypeAndExternalId(Long integrationId, String eventType, String externalId);

    List<GitHubCheckRun> findTop20ByProjectIdAndNameContainingIgnoreCaseOrderByUpdatedAtDesc(Long projectId, String name);

    List<GitHubCheckRun> findTop20ByProjectIdOrderByUpdatedAtDesc(Long projectId);
}
