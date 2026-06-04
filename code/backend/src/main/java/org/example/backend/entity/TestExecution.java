package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.backend.entity.enums.Environment;
import org.example.backend.entity.enums.TestExecutionStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * Entity mapping representing the execution result of a specific TestCase.
 */
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
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_by", nullable = false)
    private UserAccount executedBy;

    @Column(name = "executed_at", nullable = false)
    @Builder.Default
    private LocalDateTime executedAt = LocalDateTime.now();

    @Column(nullable = false, columnDefinition = "test_execution_status_enum")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private TestExecutionStatus status;

    @Column(name = "actual_result", columnDefinition = "TEXT")
    private String actualResult;

    @Column(nullable = false, columnDefinition = "environment_enum")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private Environment environment;
}
