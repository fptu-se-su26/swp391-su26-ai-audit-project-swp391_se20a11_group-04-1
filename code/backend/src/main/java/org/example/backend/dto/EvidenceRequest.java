package org.example.backend.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class EvidenceRequest {
    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Type is required")
    private String type;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private String externalUrl;
    
    // JSON array string of linked entities "[{"entityType":"TASK", "entityId":1}]"
    private String linkedEntities; 
    
    private MultipartFile file;
}
