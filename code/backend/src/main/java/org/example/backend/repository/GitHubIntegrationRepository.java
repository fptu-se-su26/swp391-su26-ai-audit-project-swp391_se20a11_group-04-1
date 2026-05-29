package org.example.backend.repository;

import org.example.backend.entity.GitHubIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Spring Data JPA Repository for GitHubIntegration.
 */
@Repository
public interface GitHubIntegrationRepository extends JpaRepository<GitHubIntegration, Long> {
    Optional<GitHubIntegration> findByProjectId(Long projectId);

}
