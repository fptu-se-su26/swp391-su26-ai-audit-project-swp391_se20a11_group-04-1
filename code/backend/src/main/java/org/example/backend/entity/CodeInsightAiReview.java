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
    private String provider = "LOCAL_RULE_ASSISTANT";

    @Column(nullable = false, length = 40)
    private String recommendation;

    @Column(nullable = false)
    @Builder.Default
    private int confidence = 0;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "risks_json", columnDefinition = "TEXT")
    private String risksJson;

    @Column(name = "review_questions_json", columnDefinition = "TEXT")
    private String reviewQuestionsJson;

    @Column(name = "score_adjustment", nullable = false)
    @Builder.Default
    private int scoreAdjustment = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
