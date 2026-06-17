package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "weekly_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "report_week_start", nullable = false)
    private LocalDate reportWeekStart;

    @Column(name = "report_week_end", nullable = false)
    private LocalDate reportWeekEnd;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "GENERATED";

    @Column(name = "red_member_count", nullable = false)
    @Builder.Default
    private int redMemberCount = 0;

    @Column(name = "total_overdue_tasks", nullable = false)
    @Builder.Default
    private int totalOverdueTasks = 0;

    @Column(name = "total_penalized_tasks", nullable = false)
    @Builder.Default
    private int totalPenalizedTasks = 0;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "generated_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Column(name = "generated_by", nullable = false, length = 50)
    @Builder.Default
    private String generatedBy = "SYSTEM";

    @OneToMany(mappedBy = "weeklyReport", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WeeklyReportMember> members = new ArrayList<>();

    public void addMember(WeeklyReportMember member) {
        members.add(member);
        member.setWeeklyReport(this);
        redMemberCount = members.size();
        totalOverdueTasks += member.getOverdueTaskCount();
        totalPenalizedTasks += member.getPenalizedTaskCount();
    }
}
