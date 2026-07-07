package org.example.backend.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDashboardResponse {
    private long reqCount;
    private long taskCount;
    private long bugCount;
    private long testCaseCount;
    private long evidenceCount;
    private double rtmCoveragePercent;
    private LocalDate deadline;
    private List<ActivityDto> recentActivities;
    private SprintInfoDto activeSprint;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SprintInfoDto {
        private String name;
        private String status;
        private LocalDate startDate;
        private LocalDate endDate;
        private int progressPercent;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActivityDto {
        private String icon;
        private String text;
        private String time;
        private String iconColor;
        private String bg;
        private String username;
    }
}
