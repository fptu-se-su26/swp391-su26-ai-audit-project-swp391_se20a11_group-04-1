package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recovery_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecoveryPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "sprint_id")
    private Long sprintId;

    @Column(name = "task_id", nullable = false)
    private Long taskId;

    @Column(name = "generated_by_user_id")
    private Long generatedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "generated_source", nullable = false, length = 30)
    @Builder.Default
    private RecoveryPlanSource generatedSource = RecoveryPlanSource.RULE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40)
    private RecoveryPlanStatus status;

    @Column(name = "risk_level", length = 30)
    private String riskLevel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "risk_categories_json", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String riskCategoriesJson = "[]";

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_by")
    private Long rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "recoveryPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RecoveryPlanAction> actions = new ArrayList<>();

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
