package org.example.backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {
    private Long userId;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String bio;
    private String phone;
    private String systemRole;
    private boolean isActive;
    private LocalDateTime createdAt;
    private List<ProfileProjectRoleResponse> projectRoles;
}
