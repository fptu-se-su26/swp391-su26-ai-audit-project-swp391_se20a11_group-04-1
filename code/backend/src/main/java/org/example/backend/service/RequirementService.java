package org.example.backend.service;

import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.RequirementResponseDTO;
import org.example.backend.dto.PaginatedResponse;
import java.util.List;

public interface RequirementService {
    RequirementResponseDTO createRequirement(RequirementRequestDTO requestDTO, Long userId);
    RequirementResponseDTO getRequirementById(Long id);
    PaginatedResponse<RequirementResponseDTO> getRequirements(
            int page,
            int size,
            Long projectId,
            String status,
            String priority,
            String tag,
            String search,
            Long ownerId);
    RequirementResponseDTO updateRequirement(Long id, RequirementRequestDTO requestDTO, Long userId);
    RequirementResponseDTO updateRequirementStatus(Long id, String status, Long userId);
    RequirementResponseDTO deleteRequirement(Long id);
    void reorderRequirements(Long projectId, org.example.backend.dto.ReorderRequestDTO request);
    List<String> getTagsByProject(Long projectId);
}
