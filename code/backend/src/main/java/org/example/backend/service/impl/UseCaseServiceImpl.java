package org.example.backend.service.impl;

import org.example.backend.dto.UseCaseRequest;
import org.example.backend.dto.UseCaseResponse;
import org.example.backend.entity.UseCase;
import org.example.backend.entity.UseCaseActor;
import org.example.backend.entity.UserAccount;
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
    private ObjectMapper objectMapper;

    @Override
    public UseCaseResponse createUseCase(UseCaseRequest request, String username) {
        UserAccount user = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UseCase useCase = new UseCase();
        mapRequestToEntity(request, useCase);
        useCase.setCreatedBy(user);

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
    public List<UseCaseResponse> getAllUseCases() {
        return useCaseRepository.findAll().stream()
                .map(this::mapEntityToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UseCaseResponse updateUseCaseStatus(Long id, String status) {
        UseCase useCase = useCaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Use case not found with id: " + id));
        
        useCase.setStatus(status);
        UseCase saved = useCaseRepository.save(useCase);
        return mapEntityToResponse(saved);
    }

    @Override
    public UseCaseResponse updateUseCase(Long id, UseCaseRequest request) {
        UseCase useCase = useCaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Use case not found with id: " + id));
        
        mapRequestToEntity(request, useCase);
        UseCase saved = useCaseRepository.save(useCase);
        return mapEntityToResponse(saved);
    }

    @Override
    public void deleteUseCase(Long id) {
        UseCase useCase = useCaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Use case not found with id: " + id));
        useCaseRepository.delete(useCase);
    }

    @Override
    public Page<UseCaseResponse> searchUseCases(String keyword, String status, Pageable pageable) {
        Specification<UseCase> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
                Predicate codeLike = cb.like(cb.lower(root.get("code")), pattern);
                predicates.add(cb.or(nameLike, codeLike));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return useCaseRepository.findAll(spec, pageable)
                .map(this::mapEntityToResponse);
    }

    private void mapRequestToEntity(UseCaseRequest request, UseCase useCase) {
        if (request.getRequirementId() != null) useCase.setRequirementId(request.getRequirementId());
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
        if (request.getStatus() != null) useCase.setStatus(request.getStatus());
        if (request.getVersion() != null) useCase.setVersion(request.getVersion());
        if (request.getCompletenessScore() != null) useCase.setCompletenessScore(request.getCompletenessScore());

        if (request.getActors() != null && !request.getActors().isEmpty()) {
            useCase.getActors().clear();
            for (String actorName : request.getActors()) {
                UseCaseActor actor = new UseCaseActor();
                actor.setActorName(actorName);
                useCase.addActor(actor);
            }
        }
    }

    private UseCaseResponse mapEntityToResponse(UseCase useCase) {
        UseCaseResponse res = new UseCaseResponse();
        res.setId(useCase.getId());
        res.setRequirementId(useCase.getRequirementId());
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
        return res;
    }
}
