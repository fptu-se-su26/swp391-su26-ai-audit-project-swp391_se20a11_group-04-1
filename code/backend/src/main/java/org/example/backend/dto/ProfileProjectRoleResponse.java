package org.example.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileProjectRoleResponse {
    private Long projectId;
    private String projectName;
    private String projectStatus;
    private String roleName;
    private LocalDateTime joinedAt;
}
