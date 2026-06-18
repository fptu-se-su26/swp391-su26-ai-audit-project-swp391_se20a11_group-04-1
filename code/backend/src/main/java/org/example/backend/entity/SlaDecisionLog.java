package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "sla_decision_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaDecisionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "sprint_id")
    private Long sprintId;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "event_type", length = 100)
    private String eventType;

    @Column(name = "previous_risk_level", length = 30)
    private String previousRiskLevel;

    @Column(name = "new_risk_level", nullable = false, length = 30)
    private String newRiskLevel;

    @Column(name = "previous_score")
    private Integer previousScore;

    @Column(name = "new_score", nullable = false)
    private int newScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "categories_json", columnDefinition = "jsonb", nullable = false)
    private String categoriesJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "reasons_json", columnDefinition = "jsonb", nullable = false)
    private String reasonsJson;

    @Column(name = "recommended_action", columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(name = "action_taken", length = 100)
    private String actionTaken;

    @Column(name = "evaluated_at", nullable = false)
    @Builder.Default
    private LocalDateTime evaluatedAt = LocalDateTime.now();
}
