package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.DiagramSyncRequest;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.UseCase;
import org.example.backend.entity.UseCaseActor;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UseCaseRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.ProjectDiagramRepository;
import org.example.backend.entity.ProjectDiagram;
import org.example.backend.dto.DiagramSaveRequest;
import org.example.backend.service.DiagramService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiagramServiceImpl implements DiagramService {

    private final UseCaseRepository useCaseRepository;
    private final RequirementRepository requirementRepository;
    private final UserAccountRepository userAccountRepository;
    private final ProjectDiagramRepository projectDiagramRepository;

    private UserAccount getCurrentUser() {
        return userAccountRepository.findById(1L)
                .orElseThrow(() -> new ResourceNotFoundException("Mock User not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public Object getDiagramData(Long projectId) {
        // Retrieve use cases for the given project and format them for frontend diagram
        List<UseCase> useCases = useCaseRepository.findByProjectId(projectId);
        
        DiagramSyncRequest response = new DiagramSyncRequest();
        List<DiagramSyncRequest.DiagramUseCaseDTO> ucDtos = new ArrayList<>();
        List<DiagramSyncRequest.DiagramActorDTO> actorDtos = new ArrayList<>();
        List<DiagramSyncRequest.DiagramRelationDTO> relations = new ArrayList<>();
        
        // Map to resolve Use Case names to IDs for include/extend relations
        Map<String, String> ucNameToIdMap = useCases.stream()
                .collect(Collectors.toMap(UseCase::getName, uc -> uc.getId().toString(), (u1, u2) -> u1));
        
        Set<String> uniqueActors = new HashSet<>();
        long relationIdCounter = 1;
        
        for (UseCase uc : useCases) {
            // Map Use Case
            DiagramSyncRequest.DiagramUseCaseDTO ucDto = new DiagramSyncRequest.DiagramUseCaseDTO();
            ucDto.setId(uc.getId().toString());
            ucDto.setName(uc.getName());
            
            // Map Actors & Actor-UC relations
            for (UseCaseActor uca : uc.getActors()) {
                String actorName = uca.getActorName();
                uniqueActors.add(actorName);
                
                DiagramSyncRequest.DiagramRelationDTO rel = new DiagramSyncRequest.DiagramRelationDTO();
                rel.setId("rel_" + (relationIdCounter++));
                rel.setType("actor-uc");
                rel.setSourceId("actor_" + actorName); // Prefix with 'actor_' to distinguish
                rel.setTargetId(uc.getId().toString());
                relations.add(rel);
            }
            
            // Includes
            if (uc.getIncludes() != null) {
                for (String includeTarget : uc.getIncludes()) {
                    String targetId = ucNameToIdMap.get(includeTarget);
                    if (targetId != null) {
                        DiagramSyncRequest.DiagramRelationDTO rel = new DiagramSyncRequest.DiagramRelationDTO();
                        rel.setId("rel_" + (relationIdCounter++));
                        rel.setType("include");
                        rel.setSourceId(uc.getId().toString());
                        rel.setTargetId(targetId);
                        relations.add(rel);
                    }
                }
            }
            // Extends
            if (uc.getExtendsList() != null) {
                for (String extendTarget : uc.getExtendsList()) {
                    String targetId = ucNameToIdMap.get(extendTarget);
                    if (targetId != null) {
                        DiagramSyncRequest.DiagramRelationDTO rel = new DiagramSyncRequest.DiagramRelationDTO();
                        rel.setId("rel_" + (relationIdCounter++));
                        rel.setType("extend");
                        rel.setSourceId(uc.getId().toString());
                        rel.setTargetId(targetId);
                        relations.add(rel);
                    }
                }
            }
            ucDtos.add(ucDto);
        }
        
        for (String actorName : uniqueActors) {
            DiagramSyncRequest.DiagramActorDTO actorDto = new DiagramSyncRequest.DiagramActorDTO();
            actorDto.setId("actor_" + actorName);
            actorDto.setName(actorName);
            actorDtos.add(actorDto);
        }
        
        response.setActors(actorDtos);
        response.setUseCases(ucDtos);
        response.setRelations(relations);
        
        return response;
    }

    @Override
    @Transactional
    public void syncDiagramData(Long projectId, DiagramSyncRequest request) {
        UserAccount currentUser = getCurrentUser();
        
        List<UseCase> existingUcs = useCaseRepository.findByProjectId(projectId);
        Map<String, UseCase> existingMap = existingUcs.stream()
                .collect(Collectors.toMap(u -> u.getId().toString(), u -> u));
        
        Set<String> incomingIds = new HashSet<>();
        
        // 1. CREATE or UPDATE Use Cases
        for (DiagramSyncRequest.DiagramUseCaseDTO dto : request.getUseCases()) {
            if (dto.getId() != null && dto.getId().startsWith("new_")) {
                // CREATE
                UseCase newUc = new UseCase();
                newUc.setName(dto.getName());
                newUc.setProjectId(projectId);
                
                // Assign a dummy requirement if it doesn't have one, or expect the frontend to pass it
                // For MVP, we will fetch the first requirement of the project and assign it
                Requirement defaultReq = requirementRepository.findByProjectId(projectId).stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("No requirement found in project to attach Use Case to"));
                newUc.setRequirement(defaultReq);

                newUc.setAiGenerated(false);
                newUc.setCreatedBy(currentUser);
                newUc.setMainFlow("{}");
                newUc.setAlternativeFlow("{}");
                
                // We'll need to assign a generated projectSubId and code, simplified here
                Integer maxSubId = useCaseRepository.findMaxProjectSubIdByProjectId(projectId);
                int subId = (maxSubId == null ? 0 : maxSubId) + 1;
                newUc.setProjectSubId(subId);
                newUc.setCode("UC" + String.format("%03d", subId));
                
                newUc = useCaseRepository.save(newUc);
                
                // Replace "new_x" references in relations with actual DB ID
                updateRelationsTempId(request.getRelations(), dto.getId(), newUc.getId().toString());
                incomingIds.add(newUc.getId().toString());
            } else if (dto.getId() != null) {
                // UPDATE
                UseCase existing = existingMap.get(dto.getId());
                if (existing != null) {
                    existing.setName(dto.getName());
                    useCaseRepository.save(existing);
                    incomingIds.add(dto.getId());
                }
            }
        }
        
        // 2. SOFT DELETE Use Cases missing from payload
        for (UseCase existing : existingUcs) {
            if (!incomingIds.contains(existing.getId().toString()) && !existing.isAiGenerated()) {
                // Soft delete
                useCaseRepository.delete(existing); 
            }
        }
        
        // 3. UPDATE RELATIONS (Includes, Extends, Actors)
        // Refresh mapping
        existingUcs = useCaseRepository.findByProjectId(projectId);
        Map<String, UseCase> updatedMap = existingUcs.stream()
                .collect(Collectors.toMap(u -> u.getId().toString(), u -> u));
                
        // Map actors from request
        Map<String, String> actorIdToNameMap = request.getActors().stream()
                .collect(Collectors.toMap(DiagramSyncRequest.DiagramActorDTO::getId, DiagramSyncRequest.DiagramActorDTO::getName));
                
        for (UseCase uc : existingUcs) {
            uc.getActors().clear(); // Clear existing actors
            List<String> includes = new ArrayList<>();
            List<String> extendsList = new ArrayList<>();
            
            for (DiagramSyncRequest.DiagramRelationDTO rel : request.getRelations()) {
                if ("actor-uc".equals(rel.getType())) {
                    if (uc.getId().toString().equals(rel.getTargetId())) {
                        String actorName = actorIdToNameMap.get(rel.getSourceId());
                        if (actorName != null) {
                            UseCaseActor uca = new UseCaseActor();
                            uca.setActorName(actorName);
                            uc.addActor(uca);
                        }
                    }
                } else if ("include".equals(rel.getType())) {
                    if (uc.getId().toString().equals(rel.getSourceId())) {
                        UseCase target = updatedMap.get(rel.getTargetId());
                        if (target != null) includes.add(target.getName()); // Store names as per DB design
                    }
                } else if ("extend".equals(rel.getType())) {
                    if (uc.getId().toString().equals(rel.getSourceId())) {
                        UseCase target = updatedMap.get(rel.getTargetId());
                        if (target != null) extendsList.add(target.getName());
                    }
                }
            }
            uc.setIncludes(includes);
            uc.setExtendsList(extendsList);
            useCaseRepository.save(uc);
        }
    }

    private void updateRelationsTempId(List<DiagramSyncRequest.DiagramRelationDTO> relations, String oldId, String newId) {
        for (DiagramSyncRequest.DiagramRelationDTO rel : relations) {
            if (oldId.equals(rel.getSourceId())) rel.setSourceId(newId);
            if (oldId.equals(rel.getTargetId())) rel.setTargetId(newId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Object getDiagramLayout(Long projectId) {
        return projectDiagramRepository.findByProjectId(projectId)
                .orElse(null);
    }

    @Override
    @Transactional
    public void saveDiagramLayout(Long projectId, DiagramSaveRequest request) {
        ProjectDiagram pd = projectDiagramRepository.findByProjectId(projectId)
                .orElse(new ProjectDiagram());
        pd.setProjectId(projectId);
        pd.setLayoutData(request.getLayoutData());
        pd.setImageBase64(request.getImageBase64());
        projectDiagramRepository.save(pd);
    }
}
