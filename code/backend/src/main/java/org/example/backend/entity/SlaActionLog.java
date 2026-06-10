package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sla_action_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "recipient_id")
    private Long recipientId;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "sla_category", length = 50)
    private String slaCategory;

    @Column(name = "action_key", nullable = false, unique = true, length = 255)
    private String actionKey;

    @Column(name = "status", nullable = false, length = 30)
    private String status; // EXECUTED, SKIPPED_DUPLICATE, FAILED

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
