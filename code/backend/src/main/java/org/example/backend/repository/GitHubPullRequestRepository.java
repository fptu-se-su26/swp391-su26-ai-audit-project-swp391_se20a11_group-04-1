package org.example.backend.repository;

import org.example.backend.entity.GitHubPullRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GitHubPullRequestRepository extends JpaRepository<GitHubPullRequest, Long> {
    Optional<GitHubPullRequest> findByIntegrationIdAndPrNumber(Long integrationId, Integer prNumber);
}
