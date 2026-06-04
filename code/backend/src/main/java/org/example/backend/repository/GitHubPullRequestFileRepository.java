package org.example.backend.repository;

import org.example.backend.entity.GitHubPullRequestFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GitHubPullRequestFileRepository extends JpaRepository<GitHubPullRequestFile, Long> {
    List<GitHubPullRequestFile> findByPullRequestIdInOrderByFilePathAsc(List<Long> pullRequestIds);

    Optional<GitHubPullRequestFile> findByPullRequestIdAndFilePath(Long pullRequestId, String filePath);
}
