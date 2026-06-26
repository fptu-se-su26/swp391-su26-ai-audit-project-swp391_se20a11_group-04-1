package org.example.backend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private boolean isActive;
    private LocalDateTime lastActive; // Mapped from updatedAt
    
    // Appeal details (nullable)
    private String appealReason;
    private String appealEvidenceUrl;
    private String appealEvidenceName;
    private String appealStatus;
    private String appealComment;
    private LocalDateTime appealResolvedAt;
    private String appealResolvedByUsername;
    private String lockReason;
    private String verifyStatus;
    private String systemRole;
}
