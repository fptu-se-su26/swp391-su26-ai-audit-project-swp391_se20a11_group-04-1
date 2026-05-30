package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "requirement_id")
    private Long requirementId;

    @Column(name = "sprint_id")
    private Long sprintId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "task_type_enum")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private TaskType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_assignee_id")
    private UserAccount primaryAssignee;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "task_assignees",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<UserAccount> assignees = new HashSet<>();

    @Column(nullable = false, columnDefinition = "priority_enum")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private Priority priority;

    @Column(name = "start_date")
    private LocalDate startDate;

    private LocalDate deadline;

    @Column(name = "sprint_plan_date")
    private LocalDate sprintPlanDate;

    @Column(nullable = false, precision = 3, scale = 1)
    @Builder.Default
    private BigDecimal weight = BigDecimal.ONE;

    @Column(name = "estimated_hours")
    private BigDecimal estimatedHours;

    @Column(nullable = false, columnDefinition = "task_status_enum")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id")
    private KanbanColumn kanbanColumn;

    @Column(name = "blocked_reason", columnDefinition = "TEXT")
    private String blockedReason;

    @Column(name = "overdue_penalty_applied", nullable = false)
    @Builder.Default
    private boolean overduePenaltyApplied = false;

    @Column(name = "overdue_penalty_applied_at")
    private LocalDateTime overduePenaltyAppliedAt;

    @Column(name = "task_code", length = 50)
    private String taskCode;

    @Column(name = "project_sub_id")
    private Integer projectSubId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserAccount createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC, id ASC")
    @Builder.Default
    private List<TaskChecklist> checklist = new ArrayList<>();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
