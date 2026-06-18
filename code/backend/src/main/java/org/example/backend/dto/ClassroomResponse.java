package org.example.backend.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomResponse {
    private Long id;
    private String subject;
    private String semester;
    private String academicYear;
    private int maxMembers;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private OwnerDto owner;
    private int memberCount;
    private int projectCount;
    
    // Detailed stats
    private ClassroomStatsDto stats;
    private java.util.List<ProjectSummaryDto> projects;
    private java.util.List<ClassroomMemberDto> members;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClassroomStatsDto {
        private int teams;
        private int students;
        private int onTrack;
        private int onTrackPercent;
        private int avgProgress;
        private int tasksDone;
        private int totalTasks;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectSummaryDto {
        private Long id;
        private String name;
        private int groupNo;
        private String description;
        private String status;
        private int completion;
        private int tasksDone;
        private int totalTasks;
        private String updatedAt;
        private java.util.List<ProjectMemberDto> members;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProjectMemberDto {
        private Long id;
        private String fullName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OwnerDto {
        private Long id;
        private String fullName;
        private String email;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClassroomMemberDto {
        private Long id;
        private String fullName;
        private String email;
    }
}
