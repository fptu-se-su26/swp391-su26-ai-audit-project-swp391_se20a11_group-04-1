package org.example.backend.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomDashboardResponse {
    private Long selectedProjectId;
    private String selectedProjectName;
    
    // Stats cards for selected project (or classroom average if no project)
    private int totalMembers;
    private int tasksCompleted;
    private int pendingIssues;
    private int totalCommits;
    
    // Classroom group list for dropdown select
    private List<GroupSelectItemDto> groups;

    private List<TeamContributionDto> teamContributions;
    private List<DayActivityDto> activityFrequency;
    private Map<String, Long> activityHeatmap;
    private int totalHeatmapCommits;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GroupSelectItemDto {
        private Long id;
        private String name;
        private int groupNo;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamContributionDto {
        private String name;
        private int tasks;   // Completed tasks
        private int commits; // Commits
        private String email;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayActivityDto {
        private String name; // e.g. "MON", "TUE", etc.
        private Map<String, Integer> groupActivities; // Maps Group/Project Name to commit count
    }
}
