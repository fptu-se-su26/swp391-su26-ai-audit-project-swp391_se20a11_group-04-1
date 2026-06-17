package org.example.backend.repository;

import org.example.backend.entity.GitHubCommit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GitHubCommitRepository extends JpaRepository<GitHubCommit, Long> {
    Optional<GitHubCommit> findByIntegrationIdAndSha(Long integrationId, String sha);

    Optional<GitHubCommit> findByProjectIdAndSha(Long projectId, String sha);

    List<GitHubCommit> findTop20ByProjectIdAndShaStartingWithIgnoreCaseOrderByUpdatedAtDesc(Long projectId, String sha);

    List<GitHubCommit> findTop20ByProjectIdAndMessageContainingIgnoreCaseOrderByUpdatedAtDesc(Long projectId, String message);

    List<GitHubCommit> findTop20ByProjectIdOrderByUpdatedAtDesc(Long projectId);
}
