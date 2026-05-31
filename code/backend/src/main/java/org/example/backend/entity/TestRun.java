package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "test_runs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRun {
    
    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "test_case_id", nullable = false)
    private Long testCaseId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String status = "RUNNING";

    @Column(name = "script_source", length = 20)
    private String scriptSource;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "steps_result", columnDefinition = "jsonb")
    private List<StepResult> stepsResult;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "failed_step", columnDefinition = "TEXT")
    private String failedStep;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "evidence_ids", columnDefinition = "jsonb")
    private List<Long> evidenceIds;

    @Column(name = "bug_report_id")
    private Long bugReportId;

    @Column(name = "triggered_by", nullable = false)
    private Long triggeredBy;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (startedAt == null) startedAt = now;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StepResult {
        private String title;
        private Integer duration;
        private String status;
        private String error;
    }
}
