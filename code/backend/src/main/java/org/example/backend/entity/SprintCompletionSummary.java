package org.example.backend.entity;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sprint_completion_summaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SprintCompletionSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id", nullable = false, unique = true)
    private Sprint sprint;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "total_tasks", nullable = false)
    private int totalTasks;

    @Column(name = "completed_tasks", nullable = false)
    private int completedTasks;

    @Column(name = "completed_on_time", nullable = false)
    private int completedOnTime;

    @Column(name = "overdue_tasks", nullable = false)
    private int overdueTasks;

    @Column(name = "penalized_tasks", nullable = false)
    private int penalizedTasks;

    @Column(name = "completion_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal completionRate;

    @Column(name = "on_time_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal onTimeRate;

    @Column(name = "ai_sprint_narrative", columnDefinition = "TEXT")
    private String aiSprintNarrative;

    @Column(name = "member_summaries_json", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String memberSummariesJson;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "generated_by", nullable = false, length = 50)
    private String generatedBy;
}
