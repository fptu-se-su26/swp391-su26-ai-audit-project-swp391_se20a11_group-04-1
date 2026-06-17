package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_code_insight_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCodeInsightSettings {
    // Project-level switches that control how strict Code Insight should be.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "review_gate_enabled", nullable = false)
    @Builder.Default
    private boolean reviewGateEnabled = true;

    // These flags are saved now and enforced by later GitHub evidence/scoring phases.
    @Column(name = "require_pr_for_done", nullable = false)
    @Builder.Default
    private boolean requirePrForDone = false;

    @Column(name = "require_ci_pass", nullable = false)
    @Builder.Default
    private boolean requireCiPass = false;

    @Column(name = "ai_review_enabled", nullable = false)
    @Builder.Default
    private boolean aiReviewEnabled = true;

    @Column(name = "min_score_warning_threshold", nullable = false)
    @Builder.Default
    private int minScoreWarningThreshold = 70;

    @Column(name = "block_score_threshold", nullable = false)
    @Builder.Default
    private int blockScoreThreshold = 50;

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
