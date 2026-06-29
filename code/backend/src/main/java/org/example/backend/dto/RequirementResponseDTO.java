package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;
import org.example.backend.entity.Priority;
import org.example.backend.entity.RequirementStatus;
import org.example.backend.entity.RequirementType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RequirementResponseDTO {
    private Long id;
    private Long projectId;
    private String reqCode;
    private String title;
    private String description;
    private RequirementType type;
    private Priority priority;
    private String acceptanceCriteria;
    private Long ownerId;
    private RequirementStatus status;
    private Boolean evidenceRequired;
    private Integer reqOrder;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> tags;
}
