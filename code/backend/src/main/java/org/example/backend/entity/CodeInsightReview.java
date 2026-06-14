package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "code_insight_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private UserAccount reviewer;

    @Column(name = "rule_score", nullable = false)
    private int ruleScore;

    @Column(name = "ai_adjustment", nullable = false)
    @Builder.Default
    private int aiAdjustment = 0;

    @Column(name = "final_score", nullable = false)
    private int finalScore;

    @Column(name = "risk_level", length = 40)
    private String riskLevel;

    @Column(name = "gate_result", length = 30)
    private String gateResult;

    @Column(name = "evidence_confidence", length = 20)
    private String evidenceConfidence;

    @Column(name = "code_risk_level", length = 20)
    private String codeRiskLevel;

    @Column(name = "score_reasons_json", columnDefinition = "TEXT")
    private String scoreReasonsJson;

    @Column(name = "evidence_snapshot_json", columnDefinition = "TEXT")
    private String evidenceSnapshotJson;

    @Column(name = "evidence_hash", nullable = false, length = 64)
    private String evidenceHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_review_id")
    private CodeInsightAiReview aiReview;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
