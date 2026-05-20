package org.example.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class EvidenceStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private String status;
    private String comment;
}
