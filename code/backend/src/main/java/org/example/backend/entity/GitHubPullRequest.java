package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "github_pull_requests",
        uniqueConstraints = @UniqueConstraint(name = "uk_github_pull_requests_integration_number", columnNames = {"integration_id", "pr_number"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GitHubPullRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private GitHubIntegration integration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "pr_number", nullable = false)
    private Integer prNumber;

    @Column(length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(length = 40)
    private String state;

    @Column(nullable = false)
    @Builder.Default
    private boolean draft = false;

    @Column(name = "author_login", length = 255)
    private String authorLogin;

    @Column(name = "head_branch", length = 255)
    private String headBranch;

    @Column(name = "base_branch", length = 255)
    private String baseBranch;

    @Column(name = "head_sha", length = 64)
    private String headSha;

    @Column(name = "merge_commit_sha", length = 64)
    private String mergeCommitSha;

    @Column(name = "merged_at")
    private LocalDateTime mergedAt;

    @Column(length = 500)
    private String url;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
