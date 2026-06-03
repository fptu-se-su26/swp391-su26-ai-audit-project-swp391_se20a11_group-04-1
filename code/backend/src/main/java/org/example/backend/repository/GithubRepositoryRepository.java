package org.example.backend.repository;

import org.example.backend.entity.GithubRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GithubRepositoryRepository extends JpaRepository<GithubRepository, Long> {
    // One repository config is allowed per project.
    Optional<GithubRepository> findByProjectId(Long projectId);

    // Webhook receiver finds the configured repository by owner/repo parsed from GitHub payload.
    Optional<GithubRepository> findByOwnerIgnoreCaseAndRepoNameIgnoreCaseAndActiveTrue(String owner, String repoName);
}
