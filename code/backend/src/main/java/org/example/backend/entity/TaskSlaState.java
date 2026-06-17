package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_sla_states")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskSlaState {

    @Id
    @Column(name = "task_id")
    private Long taskId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "sprint_id")
    private Long sprintId;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "current_risk_level", nullable = false, length = 30)
    private String currentRiskLevel;

    @Column(name = "current_score", nullable = false)
    private int currentScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "categories_json", columnDefinition = "jsonb", nullable = false)
    private String categoriesJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "reasons_json", columnDefinition = "jsonb", nullable = false)
    private String reasonsJson;

    @Column(name = "recommended_action", columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(name = "overdue_days", nullable = false)
    @Builder.Default
    private long overdueDays = 0;

    @Column(name = "days_until_deadline")
    private Long daysUntilDeadline;

    @Column(name = "has_accepted_evidence", nullable = false)
    @Builder.Default
    private boolean hasAcceptedEvidence = false;

    @Column(name = "penalty_applied", nullable = false)
    @Builder.Default
    private boolean penaltyApplied = false;

    @Column(name = "evaluated_at", nullable = false)
    @Builder.Default
    private LocalDateTime evaluatedAt = LocalDateTime.now();
}
