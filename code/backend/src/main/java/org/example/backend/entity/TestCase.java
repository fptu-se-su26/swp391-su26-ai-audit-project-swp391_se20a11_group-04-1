package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.backend.entity.enums.TestCaseStatus;
import org.example.backend.entity.enums.TestType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "test_cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SQLDelete(sql = "UPDATE test_cases SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class TestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Use raw IDs instead of entity mapping to avoid creating out-of-scope entities
    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "project_sub_id")
    private Integer projectSubId;

    @Column(name = "tc_code", length = 50)
    private String tcCode;

    @Column(name = "requirement_id", nullable = false)
    private Long requirementId;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private TestType type;

    @Column(columnDefinition = "TEXT")
    private String precondition;

    @Column(name = "expected_result", nullable = false, columnDefinition = "TEXT")
    private String expectedResult;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private TestCaseStatus status = TestCaseStatus.NOT_RUN;

    @OneToMany(mappedBy = "testCase", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stepNumber ASC")
    private List<TestStep> steps = new ArrayList<>();

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    // --- Playwright / Automation Fields ---

    @Column(name = "base_url", length = 500)
    private String baseUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "steps_structured", columnDefinition = "jsonb")
    private String stepsStructured;

    @Column(name = "cached_playwright_script", columnDefinition = "TEXT")
    private String cachedPlaywrightScript;

    @Column(name = "script_source", length = 20)
    private String scriptSource;

    @Column(name = "script_generated_at")
    private LocalDateTime scriptGeneratedAt;

    @Column(name = "last_run_status", length = 10)
    private String lastRunStatus;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "last_run_id", length = 100)
    private String lastRunId;

    @Column(name = "run_count", nullable = false)
    private Integer runCount = 0;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
