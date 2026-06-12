package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.backend.entity.enums.TestRunStatus;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_runs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestRun {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "test_runs_seq")
    @SequenceGenerator(name = "test_runs_seq", sequenceName = "test_runs_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "name", length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private TestRunStatus status = TestRunStatus.PENDING;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "correlation_id", length = 36)
    private String correlationId;

    @Column(name = "is_saved")
    @Builder.Default
    private Boolean isSaved = false;

    @Column(name = "total_test_cases", nullable = false)
    @Builder.Default
    private int totalTestCases = 0;

    @Column(name = "completed_count", nullable = false)
    @Builder.Default
    private int completedCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserAccount createdBy;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "bug_report_id")
    private Long bugReportId;

    @Column(name = "ai_analysis", columnDefinition = "TEXT")
    private String aiAnalysis;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
