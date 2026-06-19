package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "architecture_syncs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArchitectureSync {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @Column(nullable = false, length = 20)
    private String status;                 // IDLE, SYNCING, READY, ERROR

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false)
    private Integer progress;              // 0-100

    @Column(name = "current_step", length = 255)
    private String currentStep;

    @Column(name = "last_commit_sha", length = 100)
    private String lastCommitSha;

    @Column(length = 100)
    private String branch;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "synced_by")
    private UserAccount syncedBy;

    @Column(name = "mongo_graph_id", length = 100)
    private String mongoGraphId;
}
