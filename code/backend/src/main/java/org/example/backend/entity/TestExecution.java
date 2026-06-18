package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.backend.entity.enums.Environment;
import org.example.backend.entity.enums.TestExecutionStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "test_executions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_run_id")
    private TestRun testRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_by")
    private UserAccount executedBy;

    @Column(name = "executed_at")
    private LocalDateTime executedAt;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TestExecutionStatus status;

    @Column(name = "actual_result", columnDefinition = "TEXT")
    private String actualResult;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "environment", length = 50)
    @Enumerated(EnumType.STRING)
    private Environment environment;

    // Async flow fields
    @Column(name = "idempotency_key", length = 64)
    private String idempotencyKey;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "screenshot_url", length = 500)
    private String screenshotUrl;

    @Builder.Default
    @Column(name = "order_index", nullable = false)
    private int orderIndex = 0;

    @Column(name = "failed_step_index")
    private Integer failedStepIndex;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "evidence_urls", columnDefinition = "jsonb")
    private List<String> evidenceUrls;
}
