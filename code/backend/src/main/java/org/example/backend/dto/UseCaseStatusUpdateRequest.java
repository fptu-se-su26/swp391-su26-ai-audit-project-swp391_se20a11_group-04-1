package org.example.backend.dto;

import lombok.Data;
import org.example.backend.entity.UseCaseStatus;

@Data
public class UseCaseStatusUpdateRequest {
    private UseCaseStatus status;
}
