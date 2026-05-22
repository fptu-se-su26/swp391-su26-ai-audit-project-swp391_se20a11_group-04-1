package org.example.backend.service;

import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.RequirementResponseDTO;
import org.example.backend.dto.PaginatedResponse;

public interface RequirementService {
    RequirementResponseDTO createRequirement(RequirementRequestDTO requestDTO, Long userId);
    RequirementResponseDTO getRequirementById(Long id);
    PaginatedResponse<RequirementResponseDTO> getRequirements(
            int page,
            int size,
            Long projectId,
            String status,
            String priority,
            String tag);
    RequirementResponseDTO updateRequirement(Long id, RequirementRequestDTO requestDTO);
    void deleteRequirement(Long id);
}
