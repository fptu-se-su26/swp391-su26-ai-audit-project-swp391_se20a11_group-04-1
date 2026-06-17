package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity mapping representing the connection of a Project to a specific GitHub Repository.
 */
@Entity
@Table(name = "github_integrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GitHubIntegration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @Column(name = "repo_owner", nullable = false, length = 100)
    private String repoOwner;

    @Column(name = "repo_name", nullable = false, length = 100)
    private String repoName;

    @Column(name = "webhook_secret_encrypted")
    private String webhookSecretEncrypted;

    @Column(name = "webhook_url", length = 500)
    private String webhookUrl;

    @Column(name = "webhook_events_json", columnDefinition = "TEXT")
    private String webhookEventsJson;

    @Column(name = "webhook_last_synced_at")
    private LocalDateTime webhookLastSyncedAt;

    @Column(name = "connected_at", nullable = false)
    @Builder.Default
    private LocalDateTime connectedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connected_by", nullable = false)
    private UserAccount connectedBy;
}
