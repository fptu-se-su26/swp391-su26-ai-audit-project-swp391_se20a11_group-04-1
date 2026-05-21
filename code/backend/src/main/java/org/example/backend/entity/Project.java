package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "project_type_enum")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private ProjectType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_context_id")
    private AcademicContext academicContext;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate deadline;

    @Column(nullable = false, columnDefinition = "project_status_enum")
    @Builder.Default
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private ProjectStatus status = ProjectStatus.PLANNING;

    @Column(length = 7)
    private String color;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserAccount createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 20)
    private List<ProjectMember> members;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Requirement> requirements = new ArrayList<>();

    // Các trường dữ liệu tính toán động (không có trong cơ sở dữ liệu vật lý)
    @Transient
    @Builder.Default
    private int progress = 0;

    @Transient
    @Builder.Default
    private int atRiskReqCount = 0;

    @Transient
    @Builder.Default
    private String aiInsight = "On Track";

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
