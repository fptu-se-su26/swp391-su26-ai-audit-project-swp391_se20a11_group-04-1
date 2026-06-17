package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.RequirementResponseDTO;
import org.example.backend.entity.Priority;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.RequirementStatus;
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
    private final org.example.backend.repository.ProjectMemberRepository projectMemberRepository;

    private void checkLeaderAccess(Long projectId) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) throw new org.example.backend.exception.ForbiddenException("Authentication required");
        
        UserAccount user = userAccountRepository.findByUsername(auth.getName())
            .orElseThrow(() -> new org.example.backend.exception.ForbiddenException("User not found"));
            
        org.example.backend.entity.ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
            .orElseThrow(() -> new org.example.backend.exception.ForbiddenException("Access Denied: You are not an active member of this project"));
            
        if (!"LEADER".equalsIgnoreCase(member.getRole().getName()) && !"PROJECT_LEADER".equalsIgnoreCase(member.getRole().getName())) {
            throw new org.example.backend.exception.ForbiddenException("Access Denied: You must be a LEADER of this project to perform this action");
        }
    }

    @Override
    @Transactional
    public RequirementResponseDTO createRequirement(RequirementRequestDTO requestDTO, Long userId) {
        log.info("Creating new requirement: {}", requestDTO.getTitle());

        if (requestDTO.getProjectId() == null) {
            throw new BadRequestException("Project is required when creating a requirement.");
        }
        
        checkLeaderAccess(requestDTO.getProjectId());

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
            requirement.setTags(new ArrayList<>(requestDTO.getTags()));
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
        int pageSize = Math.min(Math.max(size, 1), 1000);

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

        checkLeaderAccess(requirement.getProject().getId());

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
                boolean hasPendingUseCases = useCaseRepository.existsByRequirementIdAndStatusNot(id, org.example.backend.entity.UseCaseStatus.DONE);
                if (hasPendingUseCases) {
                    throw new BadRequestException("Cannot mark Requirement as DONE because it has pending UseCases.");
                }
            }
            requirement.setStatus(requestDTO.getStatus());
        }
        if (requestDTO.getEvidenceRequired() != null) {
            requirement.setEvidenceRequired(requestDTO.getEvidenceRequired());
        }

        requirement.getTags().clear();
        if (requestDTO.getTags() != null) {
            requirement.getTags().addAll(requestDTO.getTags());
        }

        Requirement updatedReq = requirementRepository.save(requirement);
        return mapToDTO(updatedReq);
    }

    @Override
    @Transactional
    public RequirementResponseDTO updateRequirementStatus(Long id, String status) {
        log.info("Updating status for requirement id: {} to {}", id, status);
        Requirement requirement = requirementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found with id: " + id));

        var project = requirement.getProject();
        if (project.getStatus() != ProjectStatus.ACTIVE && project.getStatus() != ProjectStatus.PLANNING) {
            throw new BadRequestException("Cannot update requirements in a project that is " + project.getStatus());
        }

        RequirementStatus parsedStatus;
        try {
            parsedStatus = RequirementStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + status);
        }

        if (parsedStatus == RequirementStatus.DONE) {
            boolean hasPendingUseCases = useCaseRepository.existsByRequirementIdAndStatusNot(id, org.example.backend.entity.UseCaseStatus.DONE);
            if (hasPendingUseCases) {
                throw new BadRequestException("Cannot mark Requirement as DONE because it has pending UseCases.");
            }
        }

        requirement.setStatus(parsedStatus);
        Requirement updatedReq = requirementRepository.save(requirement);
        return mapToDTO(updatedReq);
    }

    @Override
    @Transactional
    public void deleteRequirement(Long id) {
        log.info("Deleting requirement id: {}", id);
        Requirement req = requirementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found with id: " + id));
                
        checkLeaderAccess(req.getProject().getId());
        
        requirementRepository.deleteById(id);
    }

    private RequirementResponseDTO mapToDTO(Requirement req) {
        List<String> tags = req.getTags() != null ? new ArrayList<>(req.getTags()) : new ArrayList<>();

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
                .aiGenerated(req.getAiGenerated() != null ? req.getAiGenerated() : false)
                .build();
    }

    private Specification<Requirement> buildRequirementSpec(Long projectId, String status, String priority, String tag) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Hide the System Architecture Diagram dummy requirement
            predicates.add(criteriaBuilder.notEqual(root.get("title"), "System Architecture Diagram"));

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
                jakarta.persistence.criteria.Expression<String> tagsString = criteriaBuilder.function("array_to_string", String.class, root.get("tags"), criteriaBuilder.literal(","));
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(tagsString), "%" + tag.trim().toLowerCase(Locale.ROOT) + "%"));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getTagsByProject(Long projectId) {
        if (projectId == null) {
            throw new BadRequestException("Project ID is required to fetch tags.");
        }
        return requirementRepository.findAllDistinctTagsByProjectId(projectId);
    }

    private String normalizeEnumValue(String value) {
        return value.trim().replace(' ', '_').toUpperCase(Locale.ROOT);
    }
}
