package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "github_pull_request_files",
        uniqueConstraints = @UniqueConstraint(name = "uk_github_pull_request_files_pr_path", columnNames = {"pull_request_id", "file_path"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GitHubPullRequestFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pull_request_id", nullable = false)
    private GitHubPullRequest pullRequest;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(length = 40)
    private String status;

    @Column(nullable = false)
    @Builder.Default
    private int additions = 0;

    @Column(nullable = false)
    @Builder.Default
    private int deletions = 0;

    @Column(nullable = false)
    @Builder.Default
    private int changes = 0;

    @Column(name = "patch_hash", length = 64)
    private String patchHash;

    @Column(name = "patch_summary", columnDefinition = "TEXT")
    private String patchSummary;

    @Column(name = "fetched_at", nullable = false)
    @Builder.Default
    private LocalDateTime fetchedAt = LocalDateTime.now();
}
