package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "code_insight_ai_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeInsightAiReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(nullable = false, length = 80)
    @Builder.Default
    private String provider = "GEMINI";

    @Column(length = 120)
    private String model;

    @Column(nullable = false, length = 40)
    private String recommendation;

    @Column(nullable = false)
    @Builder.Default
    private int confidence = 0;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "prompt_input_json", columnDefinition = "TEXT")
    private String promptInputJson;

    @Column(name = "prompt_preview", columnDefinition = "TEXT")
    private String promptPreview;

    @Column(name = "input_hash", length = 64)
    private String inputHash;

    @Column(name = "risks_json", columnDefinition = "TEXT")
    private String risksJson;

    @Column(name = "review_questions_json", columnDefinition = "TEXT")
    private String reviewQuestionsJson;

    @Column(name = "risk_details_json", columnDefinition = "TEXT")
    private String riskDetailsJson;

    @Column(name = "questions_for_leader_json", columnDefinition = "TEXT")
    private String questionsForLeaderJson;

    @Column(name = "evidence_assessment_json", columnDefinition = "TEXT")
    private String evidenceAssessmentJson;

    @Column(name = "review_notes_json", columnDefinition = "TEXT")
    private String reviewNotesJson;

    @Column(name = "provider_error_json", columnDefinition = "TEXT")
    private String providerErrorJson;

    @Column(name = "score_adjustment", nullable = false)
    @Builder.Default
    private int scoreAdjustment = 0;

    @Column(name = "alignment_result_json", columnDefinition = "TEXT")
    private String alignmentResultJson;

    @Column(name = "alignment_coverage_ratio")
    private Double alignmentCoverageRatio;

    @Column(name = "alignment_covered_count")
    private Integer alignmentCoveredCount;

    @Column(name = "alignment_total_count")
    private Integer alignmentTotalCount;

    @Column(name = "code_risk_level", length = 20)
    private String codeRiskLevel;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
