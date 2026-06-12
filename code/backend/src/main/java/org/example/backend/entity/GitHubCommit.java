package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "github_commits",
        uniqueConstraints = @UniqueConstraint(name = "uk_github_commits_integration_sha", columnNames = {"integration_id", "sha"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GitHubCommit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private GitHubIntegration integration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 64)
    private String sha;

    @Column(name = "branch_name", length = 255)
    private String branchName;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "author_name", length = 255)
    private String authorName;

    @Column(name = "author_email", length = 255)
    private String authorEmail;

    @Column(name = "author_login", length = 255)
    private String authorLogin;

    @Column(name = "committed_at")
    private LocalDateTime committedAt;

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
