package org.example.backend.service.impl;

import org.example.backend.dto.UseCaseRequest;
import org.example.backend.dto.UseCaseResponse;
import org.example.backend.entity.UseCase;
import org.example.backend.entity.UseCaseActor;
import org.example.backend.entity.UserAccount;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UseCaseRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.service.UseCaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class UseCaseServiceImpl implements UseCaseService {

    @Autowired
    private UseCaseRepository useCaseRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private org.example.backend.repository.ProjectRepository projectRepository;

    @Override
    public UseCaseResponse createUseCase(UseCaseRequest request, Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UseCase useCase = new UseCase();
        mapRequestToEntity(request, useCase);
        useCase.setCreatedBy(user);

        // Pessimistic Lock on Project
        var project = projectRepository.findByIdWithPessimisticWrite(useCase.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Integer maxSubId = useCaseRepository.findMaxProjectSubIdByProjectId(project.getId());
        int nextSubId = (maxSubId == null ? 0 : maxSubId) + 1;
        useCase.setProjectSubId(nextSubId);
        useCase.setCode(org.example.backend.constant.UseCaseConstants.CODE_PREFIX + project.getId() + org.example.backend.constant.UseCaseConstants.CODE_INFIX + nextSubId);

        UseCase saved = useCaseRepository.save(useCase);
        return mapEntityToResponse(saved);
    }

    @Override
    public UseCaseResponse getUseCaseById(Long id) {
        UseCase useCase = useCaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Use case not found with id: " + id));
        return mapEntityToResponse(useCase);
    }

    @Override
    public List<UseCaseResponse> getAllUseCases(Long projectId) {
        return useCaseRepository.findByProjectId(projectId).stream()
                .map(this::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UseCaseResponse updateUseCaseStatus(Long id, Long projectId, org.example.backend.entity.UseCaseStatus status) {
        UseCase useCase = useCaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Use case not found with id: " + id));
        if (!useCase.getProjectId().equals(projectId)) {
            throw new BadRequestException("Use case does not belong to the specified project");
        }
        
        useCase.setStatus(status);
        UseCase saved = useCaseRepository.save(useCase);
        return mapEntityToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UseCaseResponse updateUseCase(Long id, Long projectId, UseCaseRequest request) {
        UseCase useCase = useCaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Use case not found with id: " + id));
        if (!useCase.getProjectId().equals(projectId)) {
            throw new BadRequestException("Use case does not belong to the specified project");
        }
        
        mapRequestToEntity(request, useCase);
        
        // Clear 'Outdated Req' flag by syncing the hash
        if (useCase.getRequirement() != null) {
            org.example.backend.entity.Requirement req = useCase.getRequirement();
            String reqContentToHash = (req.getTitle() != null ? req.getTitle() : "") + "|" + (req.getDescription() != null ? req.getDescription() : "");
            String currentHash = org.springframework.util.DigestUtils.md5DigestAsHex(reqContentToHash.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            useCase.setReqVersionHash(currentHash);
        }

        UseCase saved = useCaseRepository.save(useCase);
        return mapEntityToResponse(saved);
    }

    @Override
    public void deleteUseCase(Long id, Long projectId) {
        UseCase useCase = useCaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Use case not found with id: " + id));
        if (!useCase.getProjectId().equals(projectId)) {
            throw new BadRequestException("Use case does not belong to the specified project");
        }
        useCaseRepository.delete(useCase);
    }

    @Override
    public Page<UseCaseResponse> searchUseCases(Long projectId, String keyword, String status, Boolean isDraft, Pageable pageable) {
        Specification<UseCase> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }

            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
                Predicate codeLike = cb.like(cb.lower(root.get("code")), pattern);
                predicates.add(cb.or(nameLike, codeLike));
            }

            if (status != null && !status.trim().isEmpty()) {
                try {
                    org.example.backend.entity.UseCaseStatus enumStatus = org.example.backend.entity.UseCaseStatus.valueOf(status.toUpperCase());
                    predicates.add(cb.equal(root.get("status"), enumStatus));
                } catch (IllegalArgumentException e) {
                    // Ignore invalid status format in search
                }
            }

            if (isDraft != null) {
                predicates.add(cb.equal(root.get("addedFromDiagram"), isDraft));
            } else {
                // By default, hide drafted UCs in list view unless explicitly requested
                predicates.add(cb.equal(root.get("addedFromDiagram"), false));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return useCaseRepository.findAll(spec, pageable)
                .map(this::mapEntityToResponse);
    }

    @Override
    public UseCaseResponse approveUseCase(Long id, Long projectId, Long requirementId) {
        UseCase useCase = useCaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Use case not found with id: " + id));
        
        if (!useCase.getProjectId().equals(projectId)) {
            throw new BadRequestException("Use case does not belong to the specified project");
        }
        
        if (requirementId != null) {
            org.example.backend.entity.Requirement req = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found with id: " + requirementId));
                
            if (!req.getProject().getId().equals(useCase.getProjectId())) {
                throw new org.example.backend.exception.BusinessException("Requirement does not belong to the same project");
            }
            
            useCase.setRequirement(req);
            
            String reqContentToHash = (req.getTitle() != null ? req.getTitle() : "") + "|" + (req.getDescription() != null ? req.getDescription() : "");
            String currentHash = org.springframework.util.DigestUtils.md5DigestAsHex(reqContentToHash.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            useCase.setReqVersionHash(currentHash);
        }
        
        useCase.setAddedFromDiagram(false);
        UseCase saved = useCaseRepository.save(useCase);
        return mapEntityToResponse(saved);
    }

    private void mapRequestToEntity(UseCaseRequest request, UseCase useCase) {
        if (request.getRequirementId() != null) {
            org.example.backend.entity.Requirement req = requirementRepository.findById(request.getRequirementId())
                    .orElseThrow(() -> new ResourceNotFoundException("Requirement not found"));
            
            // Validate requirement belongs to the same project
            if (useCase.getProjectId() != null && !req.getProject().getId().equals(useCase.getProjectId())) {
                throw new BadRequestException("Requirement must belong to the same project as the Use Case");
            }

            useCase.setRequirement(req);
            useCase.setProjectId(req.getProject().getId());
            
            if (req.getType() == org.example.backend.entity.RequirementType.FUNCTIONAL) {
                if (request.getMainFlow() == null || request.getMainFlow().isEmpty()) {
                    throw new BadRequestException("main_flow is required for FUNCTIONAL requirements");
                }
            }
        }
        if (request.getCode() != null) useCase.setCode(request.getCode());
        if (request.getName() != null) useCase.setName(request.getName());
        if (request.getPrecondition() != null) useCase.setPrecondition(request.getPrecondition());
        if (request.getPostcondition() != null) useCase.setPostcondition(request.getPostcondition());
        if (request.getMainFlow() != null) {
            try { useCase.setMainFlow(objectMapper.writeValueAsString(request.getMainFlow())); } catch (Exception e) { throw new BadRequestException("Invalid main flow data format: " + e.getMessage()); }
        }
        if (request.getAlternativeFlow() != null) {
            try { useCase.setAlternativeFlow(objectMapper.writeValueAsString(request.getAlternativeFlow())); } catch (Exception e) { throw new BadRequestException("Invalid alternative flow data format: " + e.getMessage()); }
        }
        if (request.getIncludesList() != null) {
            useCase.setIncludesList(request.getIncludesList());
        }
        if (request.getExtendsList() != null) {
            useCase.setExtendsList(request.getExtendsList());
        }
        if (request.getStatus() != null) useCase.setStatus(request.getStatus());
        if (request.getVersion() != null) useCase.setVersion(request.getVersion());
        // Remove completeness score update here, it will be auto-calculated

        if (request.getActors() != null) {
            useCase.getActors().clear();
            for (String actorName : request.getActors()) {
                UseCaseActor actor = new UseCaseActor();
                actor.setUseCase(useCase);
                actor.setActorName(actorName);
                useCase.getActors().add(actor);
            }
        }
    }

    private UseCaseResponse mapEntityToResponse(UseCase useCase) {
        UseCaseResponse res = new UseCaseResponse();
        res.setId(useCase.getId());
        res.setRequirementId(useCase.getRequirement() != null ? useCase.getRequirement().getId() : null);
        if (useCase.getRequirement() != null) {
            org.example.backend.entity.Requirement req = useCase.getRequirement();
            org.example.backend.dto.RequirementResponseDTO reqDto = org.example.backend.dto.RequirementResponseDTO.builder()
                    .id(req.getId())
                    .reqCode(req.getReqCode())
                    .title(req.getTitle())
                    .build();
            res.setRequirement(reqDto);
            
            if (useCase.getReqVersionHash() != null) {
                String reqContentToHash = (req.getTitle() != null ? req.getTitle() : "") + "|" + (req.getDescription() != null ? req.getDescription() : "");
                String currentHash = org.springframework.util.DigestUtils.md5DigestAsHex(reqContentToHash.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                res.setOutdated(!useCase.getReqVersionHash().equals(currentHash));
            } else {
                res.setOutdated(false);
            }
        }
        res.setCode(useCase.getCode());
        res.setName(useCase.getName());
        res.setPrecondition(useCase.getPrecondition());
        res.setPostcondition(useCase.getPostcondition());
        
        if (useCase.getMainFlow() != null) {
            try { res.setMainFlow(objectMapper.readValue(useCase.getMainFlow(), new TypeReference<Map<String, Object>>() {})); } catch (Exception e) { /* ignore */ }
        }
        if (useCase.getAlternativeFlow() != null) {
            try { res.setAlternativeFlow(objectMapper.readValue(useCase.getAlternativeFlow(), new TypeReference<Map<String, Object>>() {})); } catch (Exception e) { /* ignore */ }
        }
        
        res.setIncludesList(useCase.getIncludesList());
        res.setExtendsList(useCase.getExtendsList());
        
        if (useCase.getActors() != null) {
            res.setActors(useCase.getActors().stream()
                    .map(UseCaseActor::getActorName)
                    .collect(Collectors.toList()));
        }
        
        res.setStatus(useCase.getStatus());
        res.setVersion(useCase.getVersion());
        res.setCompletenessScore(useCase.getCompletenessScore());
        res.setCreatedById(useCase.getCreatedBy() != null ? useCase.getCreatedBy().getId() : null);
        res.setCreatedAt(useCase.getCreatedAt());
        res.setUpdatedAt(useCase.getUpdatedAt());
        res.setAddedFromDiagram(useCase.isAddedFromDiagram());
        res.setShowInDiagram(useCase.isShowInDiagram());
        res.setAiGenerated(useCase.isAiGenerated());
        res.setSourceGenerationId(useCase.getSourceGenerationId());
        return res;
    }
}
