package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.backend.entity.enums.BugSeverity;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.entity.enums.Environment;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * Entity mapping representing a BugReport, which holds detailed QA information about a software issue,
 * and links to the Task table for standard workflow management.
 */
@Entity
@Table(name = "bug_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BugReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_execution_id")
    private TestExecution testExecution;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "bug_severity_enum")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private BugSeverity severity;

    @Column(name = "environment", columnDefinition = "environment_enum")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private Environment environment;

    @Column(name = "steps_to_reproduce", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String stepsToReproduce;

    @Column(name = "expected_result", columnDefinition = "TEXT")
    private String expectedResult;

    @Column(name = "actual_result", columnDefinition = "TEXT")
    private String actualResult;

    @Column(nullable = false, columnDefinition = "bug_status_enum")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Builder.Default
    private BugStatus status = BugStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private UserAccount assignedTo;

    @Column(name = "fix_commit_hash", length = 40)
    private String fixCommitHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_task_id")
    private Task relatedTask;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserAccount createdBy;

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
