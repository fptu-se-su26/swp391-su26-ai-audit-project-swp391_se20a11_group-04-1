package org.example.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class BusinessModuleRequest {
    @NotBlank(message = "Module name is required")
    @Size(max = 200, message = "Module name must not exceed 200 characters")
    private String name;

    private String description;
    
    private Long assigneeId;
    
    private String priority = "MEDIUM";
}
