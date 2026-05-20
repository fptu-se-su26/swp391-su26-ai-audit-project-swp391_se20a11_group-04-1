package org.example.backend.service;

import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.RequirementResponseDTO;

import java.util.List;

public interface RequirementService {
    RequirementResponseDTO createRequirement(RequirementRequestDTO requestDTO);
    RequirementResponseDTO getRequirementById(Long id);
    List<RequirementResponseDTO> getAllRequirements();
    RequirementResponseDTO updateRequirement(Long id, RequirementRequestDTO requestDTO);
    void deleteRequirement(Long id);
}
