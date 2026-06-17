package org.example.backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.*;
import org.example.backend.entity.*;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.DuplicateResourceException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.EvidenceLinkRepository;
import org.example.backend.repository.EvidenceRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.EvidenceService;
import org.example.backend.service.FileStorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class EvidenceServiceImpl implements EvidenceService {

    private final EvidenceRepository evidenceRepository;
    private final EvidenceLinkRepository evidenceLinkRepository;
    private final UserAccountRepository userAccountRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    public EvidenceServiceImpl(EvidenceRepository evidenceRepository,
                               EvidenceLinkRepository evidenceLinkRepository,
                               UserAccountRepository userAccountRepository,
                               FileStorageService fileStorageService,
                               ObjectMapper objectMapper) {
        this.evidenceRepository = evidenceRepository;
        this.evidenceLinkRepository = evidenceLinkRepository;
        this.userAccountRepository = userAccountRepository;
        this.fileStorageService = fileStorageService;
        this.objectMapper = objectMapper;
    }

    // Mock getCurrentUser for MVP since Security is not fully confirmed
    private UserAccount getCurrentUser() {
        // Just return user with ID 1 as mock for now, or fetch first user
        return userAccountRepository.findById(1L)
                .orElseThrow(() -> new ResourceNotFoundException("Mock User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EvidenceResponse> searchEvidence(Long projectId, String keyword, String type, String status, Long uploadedBy, Pageable pageable) {
        Specification<Evidence> spec = Specification.where((root, query, cb) -> cb.conjunction());

        if (projectId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("projectId"), projectId));
        }

        if (keyword != null && !keyword.trim().isEmpty()) {
            String likeKeyword = "%" + keyword.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> 
                cb.or(
                    cb.like(cb.lower(root.get("title")), likeKeyword),
                    cb.like(cb.lower(root.get("description")), likeKeyword)
                )
            );
        }

        if (type != null && !type.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), EvidenceType.valueOf(type)));
        }

        if (status != null && !status.trim().isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), EvidenceStatus.valueOf(status)));
        }

        if (uploadedBy != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("uploadedBy").get("id"), uploadedBy));
        }

        return evidenceRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public EvidenceResponse getEvidenceById(Long id) {
        Evidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with id: " + id));
        return mapToResponse(evidence);
    }

    @Override
    public EvidenceResponse createEvidence(EvidenceRequest request) throws IOException {
        Evidence evidence = new Evidence();
        
        // Set project ID from request
        evidence.setProjectId(request.getProjectId());
        evidence.setUploadedBy(getCurrentUser());
        
        evidence.setType(EvidenceType.valueOf(request.getType()));
        evidence.setTitle(request.getTitle());
        evidence.setDescription(request.getDescription());
        evidence.setExternalUrl(request.getExternalUrl());
        evidence.setStatus(EvidenceStatus.PENDING);

        if (request.getFile() != null && !request.getFile().isEmpty()) {
            String fileUrl = fileStorageService.storeFile(request.getFile());
            evidence.setFileUrl(fileUrl);
        }

        Evidence savedEvidence = evidenceRepository.save(evidence);

        if (request.getLinkedEntities() != null && !request.getLinkedEntities().trim().isEmpty()) {
            try {
                List<EvidenceLinkRequest> links = objectMapper.readValue(request.getLinkedEntities(), 
                    new TypeReference<List<EvidenceLinkRequest>>() {});
                for (EvidenceLinkRequest linkReq : links) {
                    EvidenceLink link = new EvidenceLink();
                    link.setEntityType(EvidenceEntityType.valueOf(linkReq.getEntityType()));
                    link.setEntityId(linkReq.getEntityId());
                    savedEvidence.addLink(link);
                }
                // Save again with links
                evidenceRepository.save(savedEvidence);
            } catch (JsonProcessingException e) {
                throw new BadRequestException("Invalid linkedEntities format");
            }
        }

        return mapToResponse(savedEvidence);
    }

    @Override
    public EvidenceResponse updateEvidence(Long id, EvidenceRequest request) throws IOException {
        Evidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with id: " + id));

        evidence.setType(EvidenceType.valueOf(request.getType()));
        evidence.setTitle(request.getTitle());
        evidence.setDescription(request.getDescription());
        evidence.setExternalUrl(request.getExternalUrl());

        if (request.getFile() != null && !request.getFile().isEmpty()) {
            if (evidence.getFileUrl() != null) {
                fileStorageService.deleteFile(evidence.getFileUrl());
            }
            String fileUrl = fileStorageService.storeFile(request.getFile());
            evidence.setFileUrl(fileUrl);
        }

        // Update links
        if (request.getLinkedEntities() != null) {
            evidence.getEvidenceLinks().clear(); // Or remove specific ones based on complex diff
            try {
                List<EvidenceLinkRequest> links = objectMapper.readValue(request.getLinkedEntities(), 
                    new TypeReference<List<EvidenceLinkRequest>>() {});
                for (EvidenceLinkRequest linkReq : links) {
                    EvidenceLink link = new EvidenceLink();
                    link.setEntityType(EvidenceEntityType.valueOf(linkReq.getEntityType()));
                    link.setEntityId(linkReq.getEntityId());
                    evidence.addLink(link);
                }
            } catch (JsonProcessingException e) {
                throw new BadRequestException("Invalid linkedEntities format");
            }
        }

        return mapToResponse(evidenceRepository.save(evidence));
    }

    @Override
    public EvidenceResponse updateEvidenceStatus(Long id, EvidenceStatusUpdateRequest request) {
        Evidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with id: " + id));

        evidence.setStatus(EvidenceStatus.valueOf(request.getStatus()));
        evidence.setReviewedBy(getCurrentUser());
        evidence.setReviewedAt(LocalDateTime.now());
        
        // In real app, we might save the comment in metadata or a separate table
        
        return mapToResponse(evidenceRepository.save(evidence));
    }

    @Override
    public void deleteEvidence(Long id) {
        Evidence evidence = evidenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with id: " + id));
                
        if (evidence.getFileUrl() != null) {
            fileStorageService.deleteFile(evidence.getFileUrl());
        }
        
        evidenceRepository.delete(evidence);
    }

    @Override
    public EvidenceResponse linkEntity(Long evidenceId, EvidenceLinkRequest request) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with id: " + evidenceId));
                
        // Check duplicate
        boolean exists = evidence.getEvidenceLinks().stream()
                .anyMatch(l -> l.getEntityType().name().equals(request.getEntityType()) 
                        && l.getEntityId().equals(request.getEntityId()));
                        
        if (exists) {
            throw new DuplicateResourceException("Entity is already linked to this evidence");
        }

        EvidenceLink link = new EvidenceLink();
        link.setEntityType(EvidenceEntityType.valueOf(request.getEntityType()));
        link.setEntityId(request.getEntityId());
        
        evidence.addLink(link);
        return mapToResponse(evidenceRepository.save(evidence));
    }

    @Override
    public void unlinkEntity(Long evidenceId, Long linkId) {
        Evidence evidence = evidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found with id: " + evidenceId));
                
        EvidenceLink linkToRemove = evidence.getEvidenceLinks().stream()
                .filter(l -> l.getId().equals(linkId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Link not found with id: " + linkId));
                
        evidence.removeLink(linkToRemove);
        evidenceRepository.save(evidence);
    }

    private EvidenceResponse mapToResponse(Evidence evidence) {
        EvidenceResponse response = new EvidenceResponse();
        response.setId(evidence.getId());
        response.setProjectId(evidence.getProjectId());
        
        if (evidence.getUploadedBy() != null) {
            response.setUploadedById(evidence.getUploadedBy().getId());
            response.setUploadedByName(evidence.getUploadedBy().getUsername());
        }
        
        response.setType(evidence.getType().name());
        response.setTitle(evidence.getTitle());
        response.setDescription(evidence.getDescription());
        response.setFileUrl(evidence.getFileUrl());
        response.setExternalUrl(evidence.getExternalUrl());
        response.setStatus(evidence.getStatus().name());
        
        if (evidence.getMetadata() != null) {
            try {
                response.setMetadata(objectMapper.readValue(evidence.getMetadata(), new TypeReference<Map<String, Object>>() {}));
            } catch (Exception e) {
                // Ignore parsing errors for metadata
            }
        }

        if (evidence.getReviewedBy() != null) {
            response.setReviewedById(evidence.getReviewedBy().getId());
            response.setReviewedByName(evidence.getReviewedBy().getUsername());
            response.setReviewedAt(evidence.getReviewedAt());
        }

        response.setCreatedAt(evidence.getCreatedAt());
        
        if (evidence.getEvidenceLinks() != null) {
            List<EvidenceLinkDto> linkDtos = evidence.getEvidenceLinks().stream().map(link -> {
                EvidenceLinkDto dto = new EvidenceLinkDto();
                dto.setId(link.getId());
                dto.setEvidenceId(evidence.getId());
                dto.setEntityType(link.getEntityType().name());
                dto.setEntityId(link.getEntityId());
                dto.setLinkedAt(link.getLinkedAt());
                return dto;
            }).collect(Collectors.toList());
            response.setEvidenceLinks(linkDtos);
        } else {
            response.setEvidenceLinks(new ArrayList<>());
        }
        
        return response;
    }
}
