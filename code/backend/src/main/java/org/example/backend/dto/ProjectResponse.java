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
    private LocalDate deadline;
    private int progress;
    private String aiInsight;
    private List<MemberDto> members;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberDto {
        private Long id;
        private String name;
        private String role;
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
        private LocalDate deadline;
        private String major; // Sẽ được maps vào subject của AcademicContext
    }
}
