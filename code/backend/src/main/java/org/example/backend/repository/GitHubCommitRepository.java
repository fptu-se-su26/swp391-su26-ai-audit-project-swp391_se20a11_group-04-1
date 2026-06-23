package org.example.backend.repository;

import org.example.backend.entity.GitHubCommit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("SELECT COUNT(c) FROM GitHubCommit c WHERE c.project.id = :projectId")
    long countCommitsByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT c FROM GitHubCommit c WHERE c.project.academicContext.id = :classroomId AND c.committedAt >= :since")
    List<GitHubCommit> findRecentCommitsByClassroom(@Param("classroomId") Long classroomId, @Param("since") java.time.LocalDateTime since);

    @Query("SELECT c.committedAt FROM GitHubCommit c WHERE c.project.id = :projectId AND c.committedAt >= :since")
    List<java.time.LocalDateTime> findCommitDatesByProject(@Param("projectId") Long projectId, @Param("since") java.time.LocalDateTime since);
}
