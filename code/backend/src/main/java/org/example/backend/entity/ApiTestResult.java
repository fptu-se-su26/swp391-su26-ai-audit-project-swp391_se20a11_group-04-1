package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.backend.entity.enums.ApiTestStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "api_test_result")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiTestResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "environment_id")
    private ApiEnvironment environment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_by")
    private UserAccount executedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApiTestStatus status;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_headers", columnDefinition = "JSONB")
    private String responseHeaders;

    @Column(name = "response_body", columnDefinition = "TEXT")
    private String responseBody;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "assertion_results", columnDefinition = "JSONB", nullable = false)
    @Builder.Default
    private String assertionResults = "[]";

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "executed_via", nullable = false, length = 20)
    private String executedVia; // DIRECT or LOCAL_AGENT

    @Column(name = "is_saved", nullable = false)
    @Builder.Default
    private boolean isSaved = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_task_id")
    private AgentTask agentTask;

    @Column(name = "executed_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime executedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
}
