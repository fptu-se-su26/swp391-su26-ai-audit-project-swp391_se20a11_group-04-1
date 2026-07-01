package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectType;
import org.example.backend.entity.ProjectStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProjectResponse {
    private Long id;
    private String name;
    private String description;
    private ProjectType type;
    private ProjectStatus status;
    private String academicContextName;
    private String createdByUsername;
    private String createdByFullName;
    private int membersCount;
    private LocalDate startDate;
    private LocalDate deadline;
    private LocalDateTime closedAt;
    private String closedReason;
    private LocalDateTime createdAt;

    public static AdminProjectResponse fromEntity(Project project) {
        if (project == null) return null;

        String academicName = project.getAcademicContext() != null 
                ? project.getAcademicContext().getSubject() 
                : null;
        
        String username = project.getCreatedBy() != null 
                ? project.getCreatedBy().getUsername() 
                : null;

        String fullName = (project.getCreatedBy() != null && project.getCreatedBy().getProfile() != null)
                ? project.getCreatedBy().getProfile().getFullName()
                : username;

        int membersSize = project.getMembers() != null ? project.getMembers().size() : 0;

        return AdminProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .type(project.getType())
                .status(project.getStatus())
                .academicContextName(academicName)
                .createdByUsername(username)
                .createdByFullName(fullName)
                .membersCount(membersSize)
                .startDate(project.getStartDate())
                .deadline(project.getDeadline())
                .closedAt(project.getClosedAt())
                .closedReason(project.getClosedReason())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
