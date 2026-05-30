package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_penalty_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskPenaltyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(name = "penalty_label", nullable = false, length = 100)
    @Builder.Default
    private String penaltyLabel = "OVERDUE_PENALTY";

    @Column(name = "applied_by", nullable = false, length = 50)
    @Builder.Default
    private String appliedBy = "SYSTEM";

    @Column(name = "applied_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime appliedAt = LocalDateTime.now();

    @Column(nullable = false)
    @Builder.Default
    private boolean immutable = true;
}
