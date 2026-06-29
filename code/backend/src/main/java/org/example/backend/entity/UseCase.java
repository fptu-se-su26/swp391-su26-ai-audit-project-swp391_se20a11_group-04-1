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
    @JoinColumn(name = "requirement_id", nullable = false)
    private Requirement requirement;

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

    @Column(length = 50)
    private String status = "DRAFT";

    @Column(length = 20)
    private String version = "v1.0";

    @Column(name = "completeness_score")
    private Integer completenessScore = 0;

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

    @OneToMany(mappedBy = "useCase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UseCaseActor> actors = new ArrayList<>();
    
    // Helper method để thêm actor đồng bộ 2 chiều
    public void addActor(UseCaseActor actor) {
        actors.add(actor);
        actor.setUseCase(this);
    }
}
