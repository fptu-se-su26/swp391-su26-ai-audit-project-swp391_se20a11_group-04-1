package org.example.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class EvidenceLinkRequest {
    @NotNull(message = "Entity Type is required")
    private String entityType;
    @NotNull(message = "Entity ID is required")
    private Long entityId;
}
