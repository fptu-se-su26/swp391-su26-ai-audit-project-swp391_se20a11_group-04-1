package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "weekly_report_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyReportMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "weekly_report_id", nullable = false)
    private WeeklyReport weeklyReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(name = "overdue_task_count", nullable = false)
    private int overdueTaskCount;

    @Column(name = "frozen_task_count", nullable = false)
    private int frozenTaskCount;

    @Column(name = "penalized_task_count", nullable = false)
    private int penalizedTaskCount;

    @Column(name = "stale_explanation_count", nullable = false)
    private int staleExplanationCount;

    @Column(name = "risk_level", nullable = false, length = 30)
    @Builder.Default
    private String riskLevel = "RED";

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
