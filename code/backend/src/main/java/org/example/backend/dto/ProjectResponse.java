package org.example.backend.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {

    private String id;
    private String title;
    private String major;
    private String status;
    private String semester;
    private String role;
    private int atRiskReqCount;

    // Serialized as "yyyy-MM-dd" string to be compatible with HTML date input
    // and avoid Jackson 3 / JSR310 module conflicts
    private String startDate;
    private String deadline;

    private int progress;
    private String aiInsight;
    private List<MemberDto> members;
    // Appearance
    private String coverImageUrl;
    private String themeColor;
    private String color;
    private String description;
    private String type;
    private Integer maxMembers;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberDto {
        private Long id;
        private String username;
        private String name;
        private String role;
        @com.fasterxml.jackson.annotation.JsonProperty("isOnline")
        private Boolean isOnline;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateProjectRequest {
        private String name;
        private String description;
        private String type; // WEB_APP, MOBILE, DATABASE, RESEARCH, OTHER
        
        @jakarta.validation.constraints.NotNull(message = "Start date is required")
        private LocalDate startDate;
        
        @jakarta.validation.constraints.NotNull(message = "Deadline is required")
        private LocalDate deadline;
        
        private String major; // Sẽ được maps vào subject của AcademicContext
        private Long classroomId; // Optional: ID của lớp học nếu sinh viên tạo nhóm trong lớp
        private String repoOwner;
        private String repoName;
        private String webhookUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateProjectRequest {
        private String name;
        private String description;
        private String type; // WEB_APP, MOBILE, DATABASE, RESEARCH, OTHER
        private String status; // PLANNING, ACTIVE, IN_REVIEW
        private String startDate; // "yyyy-MM-dd" string to avoid Jackson 3 LocalDate issues
        private String deadline;  // "yyyy-MM-dd" string
        private Integer maxMembers;
        private String coverImageUrl;
        private String themeColor;
    }
}
