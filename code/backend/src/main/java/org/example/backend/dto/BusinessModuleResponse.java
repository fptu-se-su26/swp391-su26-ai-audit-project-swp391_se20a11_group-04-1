package org.example.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BusinessModuleResponse {
    private Long id;
    private Long projectId;
    private String name;
    private String description;
    private Long assigneeId;
    private String assigneeName;
    private String assigneeUsername;
    private String assigneeAvatar;
    private String priority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
