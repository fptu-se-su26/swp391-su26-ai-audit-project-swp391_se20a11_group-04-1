package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.backend.entity.enums.AgentTaskStatus;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agent_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "test_run_id")
    private Long testRunId;

    @Column(name = "execution_id")
    private Long executionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "script", columnDefinition = "TEXT", nullable = false)
    private String script;

    @Column(name = "base_url")
    private String baseUrl;

    @Column(name = "task_type", nullable = false, length = 30)
    @Builder.Default
    private String taskType = "PLAYWRIGHT";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private AgentTaskStatus status = AgentTaskStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result", columnDefinition = "JSONB")
    private String result;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
