package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.RequirementResponseDTO;
import org.example.backend.entity.Priority;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.RequirementStatus;
import org.example.backend.entity.RequirementTag;
import org.example.backend.entity.ProjectStatus;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.UseCaseRepository;
import org.example.backend.service.RequirementService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RequirementServiceImpl implements RequirementService {

    private final RequirementRepository requirementRepository;
    private final org.example.backend.repository.ProjectRepository projectRepository;
    private final UserAccountRepository userAccountRepository;
    private final UseCaseRepository useCaseRepository;

    @Override
    @Transactional
    public RequirementResponseDTO createRequirement(RequirementRequestDTO requestDTO, Long userId) {
        log.info("Creating new requirement: {}", requestDTO.getTitle());

        if (requestDTO.getProjectId() == null) {
            throw new BadRequestException("Project is required when creating a requirement.");
        }

        // Lock the project row to prevent race conditions on auto-increment calculation
        var project = projectRepository.findByIdWithPessimisticWrite(requestDTO.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        if (project.getStatus() != ProjectStatus.ACTIVE && project.getStatus() != ProjectStatus.PLANNING) {
            throw new BadRequestException("Cannot add requirements to a project that is " + project.getStatus());
        }

        Long finalOwnerId = requestDTO.getOwnerId() != null ? requestDTO.getOwnerId() : userId;
        UserAccount owner = userAccountRepository.findById(finalOwnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
        UserAccount creator = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Creator not found"));

        Requirement requirement = Requirement.builder()
                .title(requestDTO.getTitle())
                .description(requestDTO.getDescription())
                .type(requestDTO.getType())
                .priority(requestDTO.getPriority())
                .acceptanceCriteria(requestDTO.getAcceptanceCriteria())
                .owner(owner)
                .evidenceRequired(requestDTO.getEvidenceRequired() != null ? requestDTO.getEvidenceRequired() : false)
                .project(project)
                .createdBy(creator)
                .build();

        // Calculate next projectSubId and reqCode safely inside the transaction with Pessimistic Lock
        Integer maxSubId = requirementRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        requirement.setProjectSubId(nextSubId);
        requirement.setReqCode("REQ-" + nextSubId);

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
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found with id: " + id));
        return mapToDTO(req);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<RequirementResponseDTO> getRequirements(
            int page,
            int size,
            Long projectId,
            String status,
            String priority,
            String tag) {
        int currentPage = Math.max(page, 0);
        int pageSize = Math.min(Math.max(size, 1), 10);

        PageRequest pageRequest = PageRequest.of(
                currentPage,
                pageSize,
                Sort.by(Sort.Direction.DESC, "id")
        );

        Page<Requirement> requirementsPage = requirementRepository.findAll(
                buildRequirementSpec(projectId, status, priority, tag),
                pageRequest
        );

        List<RequirementResponseDTO> items = requirementsPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return PaginatedResponse.<RequirementResponseDTO>builder()
                .items(items)
                .currentPage(requirementsPage.getNumber())
                .pageSize(requirementsPage.getSize())
                .totalItems(requirementsPage.getTotalElements())
                .totalPages(requirementsPage.getTotalPages())
                .hasMore(requirementsPage.hasNext())
                .build();
    }

    @Override
    @Transactional
    public RequirementResponseDTO updateRequirement(Long id, RequirementRequestDTO requestDTO) {
        log.info("Updating requirement id: {}", id);
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found with id: " + id));

        requirement.setTitle(requestDTO.getTitle());
        requirement.setDescription(requestDTO.getDescription());
        requirement.setType(requestDTO.getType());
        requirement.setPriority(requestDTO.getPriority());
        requirement.setAcceptanceCriteria(requestDTO.getAcceptanceCriteria());
        
        if (requestDTO.getOwnerId() != null) {
            UserAccount owner = userAccountRepository.findById(requestDTO.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Owner not found"));
            requirement.setOwner(owner);
        }

        if (requestDTO.getStatus() != null) {
            // Check project status before status update
            var project = requirement.getProject();
            if (project.getStatus() != ProjectStatus.ACTIVE && project.getStatus() != ProjectStatus.PLANNING) {
                throw new BadRequestException("Cannot update requirements in a project that is " + project.getStatus());
            }

            // Enforce DONE State Constraints
            if (requestDTO.getStatus() == RequirementStatus.DONE) {
                boolean hasPendingUseCases = useCaseRepository.existsByRequirementIdAndStatusNot(id, "DONE");
                if (hasPendingUseCases) {
                    throw new BadRequestException("Cannot mark Requirement as DONE because it has pending UseCases.");
                }
            }
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
            throw new ResourceNotFoundException("Requirement not found with id: " + id);
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
                .reqCode(req.getReqCode())
                .title(req.getTitle())
                .description(req.getDescription())
                .type(req.getType())
                .priority(req.getPriority())
                .acceptanceCriteria(req.getAcceptanceCriteria())
                .ownerId(req.getOwner() != null ? req.getOwner().getId() : null)
                .status(req.getStatus())
                .evidenceRequired(req.getEvidenceRequired())
                .reqOrder(req.getReqOrder())
                .createdBy(req.getCreatedBy() != null ? req.getCreatedBy().getId() : null)
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .tags(tags)
                .build();
    }

    private Specification<Requirement> buildRequirementSpec(Long projectId, String status, String priority, String tag) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(criteriaBuilder.equal(root.get("project").get("id"), projectId));
            }

            if (status != null && !status.isBlank()) {
                RequirementStatus parsedStatus = RequirementStatus.valueOf(normalizeEnumValue(status));
                predicates.add(criteriaBuilder.equal(root.get("status"), parsedStatus));
            }

            if (priority != null && !priority.isBlank()) {
                Priority parsedPriority = Priority.valueOf(normalizeEnumValue(priority));
                predicates.add(criteriaBuilder.equal(root.get("priority"), parsedPriority));
            }

            if (tag != null && !tag.isBlank()) {
                query.distinct(true);
                Join<Requirement, RequirementTag> tagsJoin = root.join("tags", JoinType.LEFT);
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(tagsJoin.get("tag")), tag.trim().toLowerCase(Locale.ROOT)));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String normalizeEnumValue(String value) {
        return value.trim().replace(' ', '_').toUpperCase(Locale.ROOT);
    }
}
