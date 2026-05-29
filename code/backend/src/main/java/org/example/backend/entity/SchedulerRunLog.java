package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "scheduler_run_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchedulerRunLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_name", nullable = false, length = 100)
    private String jobName;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "started_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "total_scanned", nullable = false)
    @Builder.Default
    private int totalScanned = 0;

    @Column(name = "total_created", nullable = false)
    @Builder.Default
    private int totalCreated = 0;

    @Column(name = "total_sent", nullable = false)
    @Builder.Default
    private int totalSent = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
