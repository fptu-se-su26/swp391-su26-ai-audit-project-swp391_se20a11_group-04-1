package org.example.backend.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyReportResponse {
    private Long id;
    private Long projectId;
    private String projectName;
    private LocalDate reportWeekStart;
    private LocalDate reportWeekEnd;
    private String status;
    private int redMemberCount;
    private int totalOverdueTasks;
    private int totalPenalizedTasks;
    private String summary;
    private LocalDateTime generatedAt;
    private String generatedBy;
    private List<MemberRisk> members;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberRisk {
        private Long userId;
        private String name;
        private String email;
        private int overdueTaskCount;
        private int frozenTaskCount;
        private int penalizedTaskCount;
        private int staleExplanationCount;
        private String riskLevel;
        private String reason;
    }
}
