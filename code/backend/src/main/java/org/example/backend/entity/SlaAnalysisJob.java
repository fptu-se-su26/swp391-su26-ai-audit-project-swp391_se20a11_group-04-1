package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sla_analysis_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaAnalysisJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "sprint_id", nullable = false)
    private Long sprintId;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "triggered_by")
    private Long triggeredBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
