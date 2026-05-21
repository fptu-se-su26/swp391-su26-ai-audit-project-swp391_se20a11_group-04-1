package org.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.backend.entity.Priority;
import org.example.backend.entity.RequirementType;
import org.example.backend.entity.RequirementStatus;

import java.util.List;

@Data
public class RequirementRequestDTO {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    private RequirementStatus status;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Type is required")
    private RequirementType type;

    @NotNull(message = "Priority is required")
    private Priority priority;

    @NotNull(message = "Acceptance criteria is required")
    private String acceptanceCriteria;

    private Long ownerId;

    private Boolean evidenceRequired;

    private List<String> tags;
}
