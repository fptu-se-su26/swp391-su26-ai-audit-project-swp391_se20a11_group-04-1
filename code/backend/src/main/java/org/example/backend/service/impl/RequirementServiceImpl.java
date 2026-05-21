package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.RequirementResponseDTO;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.RequirementTag;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.service.RequirementService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RequirementServiceImpl implements RequirementService {

    private final RequirementRepository requirementRepository;
    private final org.example.backend.repository.ProjectRepository projectRepository;

    @Override
    @Transactional
    public RequirementResponseDTO createRequirement(RequirementRequestDTO requestDTO, Long userId) {
        log.info("Creating new requirement: {}", requestDTO.getTitle());

        Requirement requirement = Requirement.builder()
                .title(requestDTO.getTitle())
                .description(requestDTO.getDescription())
                .type(requestDTO.getType())
                .priority(requestDTO.getPriority())
                .acceptanceCriteria(requestDTO.getAcceptanceCriteria())
                .ownerId(requestDTO.getOwnerId() != null ? requestDTO.getOwnerId() : userId)
                .evidenceRequired(requestDTO.getEvidenceRequired() != null ? requestDTO.getEvidenceRequired() : false)
                .project(projectRepository.getReferenceById(requestDTO.getProjectId()))
                .createdBy(userId)
                .build();

        // Fix: @Builder.Default conflicts with .builder().status() — must set AFTER build()
        if (requestDTO.getStatus() != null) {
            requirement.setStatus(requestDTO.getStatus());
        }

        if (requestDTO.getTags() != null) {
            for (String tagName : requestDTO.getTags()) {
                RequirementTag tag = RequirementTag.builder().tag(tagName).build();
                requirement.addTag(tag);
            }
        }

        Requirement savedReq = requirementRepository.save(requirement);
        return mapToDTO(savedReq);
    }

    @Override
    @Transactional(readOnly = true)
    public RequirementResponseDTO getRequirementById(Long id) {
        Requirement req = requirementRepository.findById(id)
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Requirement not found with id: " + id));
        return mapToDTO(req);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RequirementResponseDTO> getAllRequirements() {
        return requirementRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RequirementResponseDTO updateRequirement(Long id, RequirementRequestDTO requestDTO) {
        log.info("Updating requirement id: {}", id);
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Requirement not found with id: " + id));

        requirement.setTitle(requestDTO.getTitle());
        requirement.setDescription(requestDTO.getDescription());
        requirement.setType(requestDTO.getType());
        requirement.setPriority(requestDTO.getPriority());
        requirement.setAcceptanceCriteria(requestDTO.getAcceptanceCriteria());
        requirement.setOwnerId(requestDTO.getOwnerId());
        if (requestDTO.getStatus() != null) {
            requirement.setStatus(requestDTO.getStatus());
        }
        if (requestDTO.getEvidenceRequired() != null) {
            requirement.setEvidenceRequired(requestDTO.getEvidenceRequired());
        }

        // Update tags — orphan removal handles deletion of old tags
        requirement.getTags().clear();
        if (requestDTO.getTags() != null) {
            for (String tagName : requestDTO.getTags()) {
                RequirementTag tag = RequirementTag.builder().tag(tagName).build();
                requirement.addTag(tag);
            }
        }

        Requirement updatedReq = requirementRepository.save(requirement);
        return mapToDTO(updatedReq);
    }

    @Override
    @Transactional
    public void deleteRequirement(Long id) {
        log.info("Deleting requirement id: {}", id);
        if (!requirementRepository.existsById(id)) {
            throw new CustomException.ResourceNotFoundException("Requirement not found with id: " + id);
        }
        requirementRepository.deleteById(id);
    }

    private RequirementResponseDTO mapToDTO(Requirement req) {
        List<String> tags = req.getTags().stream()
                .map(RequirementTag::getTag)
                .collect(Collectors.toList());

        return RequirementResponseDTO.builder()
                .id(req.getId())
                .projectId(req.getProject().getId())
                .title(req.getTitle())
                .description(req.getDescription())
                .type(req.getType())
                .priority(req.getPriority())
                .acceptanceCriteria(req.getAcceptanceCriteria())
                .ownerId(req.getOwnerId())
                .status(req.getStatus())
                .evidenceRequired(req.getEvidenceRequired())
                .reqOrder(req.getReqOrder())
                .createdBy(req.getCreatedBy())
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .tags(tags)
                .build();
    }
}
