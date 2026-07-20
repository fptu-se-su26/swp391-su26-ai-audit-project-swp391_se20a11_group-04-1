package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "use_cases")
@Data
@SQLDelete(sql = "UPDATE use_cases SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false")
public class UseCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "project_sub_id")
    private Integer projectSubId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id")
    private Requirement requirement;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "requirement_use_cases",
            joinColumns = @JoinColumn(name = "use_case_id"),
            inverseJoinColumns = @JoinColumn(name = "requirement_id")
    )
    private java.util.List<Requirement> requirements = new java.util.ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private BusinessModule businessModule;

    @Column(name = "code", unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String precondition;

    @Column(columnDefinition = "TEXT")
    private String postcondition;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "main_flow", columnDefinition = "jsonb", nullable = false)
    private String mainFlow;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "alternative_flow", columnDefinition = "jsonb")
    private String alternativeFlow;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "includes_list", columnDefinition = "jsonb")
    private List<String> includesList;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extends_list", columnDefinition = "jsonb")
    private List<String> extendsList;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private     UseCaseStatus status = UseCaseStatus.DRAFT;

    @Column(length = 20)
    private String version = org.example.backend.constant.UseCaseConstants.DEFAULT_VERSION;

    @Column(name = "completeness_score")
    private Integer completenessScore = 0;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(name = "start_date")
    private java.time.LocalDate startDate;

    @Column(name = "deadline")
    private java.time.LocalDate deadline;

    @Column(name = "uc_order")
    private Integer ucOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserAccount createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "ai_generated")
    private boolean aiGenerated = false;

    @Column(name = "source_generation_id")
    private java.util.UUID sourceGenerationId;

    @OneToMany(mappedBy = "useCase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UseCaseActor> actors = new ArrayList<>();
    
    @Column(name = "req_version_hash", length = 255)
    private String reqVersionHash;
    
    @Column(name = "show_in_diagram", nullable = false)
    private boolean showInDiagram = true;
    
    @Column(name = "added_from_diagram", nullable = false)
    private boolean addedFromDiagram = false;
    
    // Helper method để thêm actor đồng bộ 2 chiều
    public void addActor(UseCaseActor actor) {
        actors.add(actor);
        actor.setUseCase(this);
    }

    @PrePersist
    @PreUpdate
    public void calculateCompletenessScore() {
        int score = 0;
        int totalFields = 6;
        
        if (name != null && !name.trim().isEmpty()) score++;
        if (precondition != null && !precondition.trim().isEmpty()) score++;
        if (postcondition != null && !postcondition.trim().isEmpty()) score++;
        if (mainFlow != null && !mainFlow.trim().isEmpty() && !mainFlow.equals("[]")) score++;
        if (alternativeFlow != null && !alternativeFlow.trim().isEmpty() && !alternativeFlow.equals("[]")) score++;
        if (actors != null && !actors.isEmpty()) score++;
        
        this.completenessScore = Math.round(((float) score / totalFields) * 100);
    }
}
