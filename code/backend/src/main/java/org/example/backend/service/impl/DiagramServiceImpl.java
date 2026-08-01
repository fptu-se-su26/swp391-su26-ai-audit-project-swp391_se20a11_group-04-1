package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.DiagramSyncRequest;
import org.example.backend.dto.DiagramSyncResponse;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.UseCase;
import org.example.backend.entity.UseCaseActor;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UseCaseRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.ProjectDiagramRepository;
import org.example.backend.repository.ProjectActorRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.BusinessModuleRepository;
import org.example.backend.entity.ProjectDiagram;
import org.example.backend.entity.ProjectActor;
import org.example.backend.entity.Project;
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
    private final ProjectActorRepository projectActorRepository;
    private final ProjectRepository projectRepository;
    private final BusinessModuleRepository businessModuleRepository;

    @Override
    @Transactional(readOnly = true)
    public Object getDiagramData(Long projectId, Long moduleId, String activeView) {
        // Retrieve use cases for the given project
        List<UseCase> useCases = useCaseRepository.findByProjectId(projectId).stream()
            .filter(uc -> uc.getStatus() != org.example.backend.entity.UseCaseStatus.REJECTED)
            .collect(Collectors.toList());
        
        if ("module".equals(activeView) && moduleId != null) {
            useCases = useCases.stream()
                .filter(uc -> (uc.getBusinessModule() != null && uc.getBusinessModule().getId().equals(moduleId)))
                .collect(Collectors.toList());
        }
        // "all" or null -> return all use cases
        
        DiagramSyncResponse response = new DiagramSyncResponse();
        List<DiagramSyncResponse.DiagramUseCaseDTO> ucDtos = new ArrayList<>();
        List<DiagramSyncResponse.DiagramActorDTO> actorDtos = new ArrayList<>();
        List<DiagramSyncResponse.DiagramRelationDTO> relations = new ArrayList<>();
        
        // Map to resolve Use Case names to IDs for include/extend relations with robustness
        Map<String, String> ucNameToIdMap = new HashMap<>();
        Set<String> validUcIds = new HashSet<>();
        for (UseCase uc : useCases) {
            validUcIds.add(uc.getId().toString());
            if (uc.getName() == null) continue;
            String cleanName = uc.getName().trim().toLowerCase();
            ucNameToIdMap.put(cleanName, uc.getId().toString());
            if (cleanName.matches("^uc-\\d+\\s*:\\s*.*")) {
                 String unPrefixed = cleanName.replaceFirst("^uc-\\d+\\s*:\\s*", "").trim();
                 ucNameToIdMap.put(unPrefixed, uc.getId().toString());
            }
        }
        
        List<ProjectActor> projectActors = projectActorRepository.findByProjectId(projectId);
        Map<String, String> actorNameToIdMap = new HashMap<>();
        for (ProjectActor pa : projectActors) {
            if (pa.isDeleted()) continue; // Ignore soft-deleted actors
            
            DiagramSyncResponse.DiagramActorDTO actorDto = new DiagramSyncResponse.DiagramActorDTO();
            actorDto.setId("actor_" + pa.getId());
            actorDto.setName(pa.getName());
            actorDto.setInheritsFrom(pa.getInheritsFrom());
            actorDtos.add(actorDto);
            actorNameToIdMap.put(pa.getName(), pa.getId().toString());
        }
        
        long relationIdCounter = 1;
        
        for (UseCase uc : useCases) {
            DiagramSyncResponse.DiagramUseCaseDTO ucDto = new DiagramSyncResponse.DiagramUseCaseDTO();
            ucDto.setId(uc.getId().toString());
            ucDto.setName(uc.getName());
            ucDto.setShowInDiagram(uc.isShowInDiagram());
            ucDto.setAddedFromDiagram(uc.isAddedFromDiagram());
            if (uc.getBusinessModule() != null) {
                ucDto.setModuleId(uc.getBusinessModule().getId());
                ucDto.setModuleName(uc.getBusinessModule().getName());
            }
            
            // Map Actors & Actor-UC relations
            for (UseCaseActor uca : uc.getActors()) {
                String paId = null;
                String actorName = null;
                
                if (uca.getProjectActor() != null) {
                    paId = uca.getProjectActor().getId().toString();
                    actorName = uca.getProjectActor().getName();
                } else {
                    actorName = uca.getActorName();
                    paId = actorNameToIdMap.get(actorName);
                }
                
                if (paId == null) {
                    paId = actorName;
                    DiagramSyncResponse.DiagramActorDTO tempActorDto = new DiagramSyncResponse.DiagramActorDTO();
                    tempActorDto.setId("actor_" + paId);
                    tempActorDto.setName(actorName);
                    actorDtos.add(tempActorDto);
                    actorNameToIdMap.put(actorName, paId);
                }
                
                DiagramSyncResponse.DiagramRelationDTO rel = new DiagramSyncResponse.DiagramRelationDTO();
                rel.setId("rel_" + (relationIdCounter++));
                rel.setType("actor-uc");
                rel.setSourceId("actor_" + paId); 
                rel.setTargetId(uc.getId().toString());
                relations.add(rel);
            }
            
            // Includes
            if (uc.getIncludesList() != null) {
                for (String includeTarget : uc.getIncludesList()) {
                    String targetId = validUcIds.contains(includeTarget) ? includeTarget : resolveUseCaseIdRobustly(includeTarget, ucNameToIdMap);
                    if (targetId != null && !targetId.equals(uc.getId().toString())) {
                        DiagramSyncResponse.DiagramRelationDTO rel = new DiagramSyncResponse.DiagramRelationDTO();
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
                    String targetId = validUcIds.contains(extendTarget) ? extendTarget : resolveUseCaseIdRobustly(extendTarget, ucNameToIdMap);
                    if (targetId != null && !targetId.equals(uc.getId().toString())) {
                        DiagramSyncResponse.DiagramRelationDTO rel = new DiagramSyncResponse.DiagramRelationDTO();
                        rel.setId("rel_" + (relationIdCounter++));
                        rel.setType("extends");
                        rel.setSourceId(uc.getId().toString());
                        rel.setTargetId(targetId);
                        relations.add(rel);
                    }
                }
            }
            ucDtos.add(ucDto);
        }

        // Identify actors directly connected to the Use Cases
        java.util.Set<String> activeActorIds = new HashSet<>();
        for (DiagramSyncResponse.DiagramRelationDTO rel : relations) {
            if (rel.getType().equals("actor-uc")) {
                if (rel.getSourceId().startsWith("actor_")) activeActorIds.add(rel.getSourceId());
                if (rel.getTargetId().startsWith("actor_")) activeActorIds.add(rel.getTargetId());
            }
        }
        
        // Build generalization hierarchy and collect all required actors (including parents)
        Map<String, String> childToParentMap = new HashMap<>();
        for (ProjectActor pa : projectActors) {
            if (pa.isDeleted() || pa.getInheritsFrom() == null || pa.getInheritsFrom().trim().isEmpty()) continue;
            String parentId = actorNameToIdMap.get(pa.getInheritsFrom().trim());
            if (parentId != null) {
                childToParentMap.put("actor_" + pa.getId(), "actor_" + parentId);
            }
        }
        
        Set<String> finalRequiredActorIds = new HashSet<>(activeActorIds);
        boolean changed;
        do {
            changed = false;
            Set<String> newAdditions = new HashSet<>();
            for (String actorId : finalRequiredActorIds) {
                String parentId = childToParentMap.get(actorId);
                if (parentId != null && !finalRequiredActorIds.contains(parentId)) {
                    newAdditions.add(parentId);
                    changed = true;
                }
            }
            finalRequiredActorIds.addAll(newAdditions);
        } while (changed);

        // Map ONLY required Actor Generalization relations
        for (Map.Entry<String, String> entry : childToParentMap.entrySet()) {
            if (finalRequiredActorIds.contains(entry.getKey()) && finalRequiredActorIds.contains(entry.getValue())) {
                DiagramSyncResponse.DiagramRelationDTO rel = new DiagramSyncResponse.DiagramRelationDTO();
                rel.setId("rel_" + (relationIdCounter++));
                rel.setType("actor-generalization");
                rel.setSourceId(entry.getKey());
                rel.setTargetId(entry.getValue());
                relations.add(rel);
            }
        }
            
        List<DiagramSyncResponse.DiagramActorDTO> filteredActorDtos = actorDtos.stream()
            .filter(a -> finalRequiredActorIds.contains(a.getId()))
            .collect(Collectors.toList());
        
        response.setActors(filteredActorDtos);
        response.setUseCases(ucDtos);
        response.setRelations(relations);
        
        return response;
    }

    @Override
    @Transactional
    public java.util.Map<String, String> syncDiagramData(Long projectId, DiagramSyncRequest request, Long userId, Long moduleId) {
        UserAccount currentUser = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
                
        List<UseCase> existingUcsBeforeUpdate = useCaseRepository.findByProjectId(projectId);
        if (moduleId != null) {
            existingUcsBeforeUpdate = existingUcsBeforeUpdate.stream()
                .filter(uc -> (uc.getBusinessModule() != null && uc.getBusinessModule().getId().equals(moduleId)))
                .collect(Collectors.toList());
        }
        Set<String> linkedActorNames = new HashSet<>();
        for (UseCase uc : existingUcsBeforeUpdate) {
            if (uc.getActors() != null) {
                for (org.example.backend.entity.UseCaseActor uca : uc.getActors()) {
                    linkedActorNames.add(uca.getActorName());
                }
            }
        }

        // Sync Actors to ProjectActor table
        List<ProjectActor> existingProjectActors = projectActorRepository.findByProjectId(projectId);
        Map<String, ProjectActor> existingActorMap = existingProjectActors.stream()
                .collect(Collectors.toMap(a -> "actor_" + a.getId(), a -> a));
        Map<String, ProjectActor> existingActorByName = existingProjectActors.stream()
                .collect(Collectors.toMap(a -> a.getName(), a -> a, (a1, a2) -> a1));
                
        java.util.Map<String, String> idMappings = new java.util.HashMap<>();
                
        for (DiagramSyncRequest.DiagramActorDTO actorDto : request.getActors()) {
            ProjectActor pa = null;
            if (actorDto.getId().startsWith("actor_") && !actorDto.getId().startsWith("actor_new")) {
                pa = existingActorMap.get(actorDto.getId());
            }
            if (pa == null) {
                pa = existingActorByName.get(actorDto.getName());
            }

            if (pa != null) {
                if (pa.isDeleted()) {
                    pa.setDeleted(false);
                    projectActorRepository.save(pa);
                }
                if (!pa.getName().equals(actorDto.getName())) {
                    pa.setName(actorDto.getName());
                    projectActorRepository.save(pa);
                }
                if (actorDto.getId().startsWith("actor_") && !actorDto.getId().equals("actor_" + pa.getId())) {
                    updateRelationsTempId(request.getRelations(), actorDto.getId(), "actor_" + pa.getId());
                }
                // ALWAYS update the ID to the real ID so actorIdToNameMap works correctly
                if (actorDto.getId().startsWith("new_") || actorDto.getId().startsWith("actor_new_")) {
                    idMappings.put(actorDto.getId(), "actor_" + pa.getId());
                }
                actorDto.setId("actor_" + pa.getId());
            } else {
                ProjectActor newPa = new ProjectActor();
                newPa.setProject(project);
                newPa.setName(actorDto.getName());
                newPa = projectActorRepository.save(newPa);
                if (actorDto.getId().startsWith("new_") || actorDto.getId().startsWith("actor_new_")) {
                    idMappings.put(actorDto.getId(), "actor_" + newPa.getId());
                }
                updateRelationsTempId(request.getRelations(), actorDto.getId(), "actor_" + newPa.getId());
                actorDto.setId("actor_" + newPa.getId());
                
                // Add to maps to prevent duplicates in same payload
                existingActorByName.put(newPa.getName(), newPa);
                existingActorMap.put("actor_" + newPa.getId(), newPa);
            }
        }
        
        List<UseCase> existingUcs = useCaseRepository.findByProjectId(projectId);
        Map<String, UseCase> existingMap = existingUcs.stream()
                .collect(Collectors.toMap(u -> u.getId().toString(), u -> u));
        
        Set<String> incomingIds = new HashSet<>();
        
        // 1. CREATE or UPDATE Use Cases
        for (DiagramSyncRequest.DiagramUseCaseDTO dto : request.getUseCases()) {
            if (dto.getId() != null && dto.getId().startsWith("new_")) {
                // Safeguard against duplicate UCs
                UseCase existing = null;
                for (UseCase uc : existingUcs) {
                    if (uc.getName() != null && uc.getName().equals(dto.getName()) && uc.isAddedFromDiagram()) {
                        existing = uc;
                        break;
                    }
                }
                
                if (existing != null) {
                    idMappings.put(dto.getId(), existing.getId().toString());
                    updateRelationsTempId(request.getRelations(), dto.getId(), existing.getId().toString());
                    incomingIds.add(existing.getId().toString());
                    // Treat as UPDATE
                    existing.setShowInDiagram(dto.isShowInDiagram());
                    useCaseRepository.save(existing);
                } else {
                    // CREATE
                    UseCase newUc = new UseCase();
                    newUc.setName(dto.getName());
                    newUc.setProjectId(projectId);
                    // Assign to a specific System Architecture Diagram requirement
                    Requirement defaultReq = requirementRepository.findByProjectId(projectId).stream()
                          .filter(r -> "System Architecture Diagram".equals(r.getTitle()))
                          .findFirst()
                          .orElseGet(() -> {
                              Integer maxReqSubId = requirementRepository.findMaxProjectSubIdByProjectId(projectId);
                              int reqSubId = (maxReqSubId == null ? 0 : maxReqSubId) + 1;
                              Requirement newReq = Requirement.builder()
                                      .project(project)
                                      .title("System Architecture Diagram")
                                      .description("Tự động tạo ra để chứa các Use Case vẽ thủ công từ sơ đồ.")
                                      .type(org.example.backend.entity.RequirementType.FUNCTIONAL)
                                      .priority(org.example.backend.entity.Priority.MEDIUM)
                                      .acceptanceCriteria("[]")
                                      .status(org.example.backend.entity.RequirementStatus.DONE)
                                      .projectSubId(reqSubId)
                                      .reqCode("REQ-" + reqSubId)
                                      .owner(currentUser)
                                      .createdBy(currentUser)
                                      .aiGenerated(false)
                                      .build();
                              return requirementRepository.save(newReq);
                          });
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
                newUc.setAddedFromDiagram(true);
                
                // BUG-2 FIX: Assign businessModule so the UC belongs to the correct module
                if (moduleId != null) {
                    businessModuleRepository.findById(moduleId).ifPresent(newUc::setBusinessModule);
                }
                
                newUc = useCaseRepository.save(newUc);
                
                idMappings.put(dto.getId(), newUc.getId().toString());
                // Replace "new_x" references in relations with actual DB ID
                updateRelationsTempId(request.getRelations(), dto.getId(), newUc.getId().toString());
                incomingIds.add(newUc.getId().toString());
                
                // Add to existingUcs so relations can find it
                existingUcs.add(newUc);
                }
            } else if (dto.getId() != null) {
                  // UPDATE
                  UseCase existing = existingMap.get(dto.getId());
                  if (existing != null) {
                      // Update showInDiagram flag directly from DTO
                      existing.setShowInDiagram(dto.isShowInDiagram());
                      
                      // BUG 1 FIX: Only update name if it's a draft (addedFromDiagram)
                      if (existing.isAddedFromDiagram()) {
                          existing.setName(dto.getName());
                      }
                      
                      useCaseRepository.save(existing);
                      
                      if (dto.isShowInDiagram()) {
                          incomingIds.add(dto.getId());
                      }
                  }
              }
        }
        
        // 2. SOFT HIDE Use Cases missing from payload
        // BUG-3 FIX: Only scope to UCs belonging to this module (not ALL project UCs)
        // This prevents hiding UCs from other modules when saving a specific module diagram.
        List<UseCase> ucsToCheck = existingUcs;
        if (moduleId != null) {
            ucsToCheck = existingUcs.stream()
                .filter(uc -> uc.getBusinessModule() != null && uc.getBusinessModule().getId().equals(moduleId))
                .collect(Collectors.toList());
        }
        for (UseCase existing : ucsToCheck) {
            if (!incomingIds.contains(existing.getId().toString()) && !existing.isAiGenerated()) {
                // Soft Hide: If it's missing from diagram, just hide it
                existing.setShowInDiagram(false);
                useCaseRepository.save(existing);
            } else if (incomingIds.contains(existing.getId().toString()) && !existing.isShowInDiagram()) {
                // Restore if it was hidden
                existing.setShowInDiagram(true);
                useCaseRepository.save(existing);
            }
        }
        
        // 3. UPDATE RELATIONS (Includes, Extends, Actors)
        // Refresh mapping
        existingUcs = useCaseRepository.findByProjectId(projectId);
        if (moduleId != null) {
            existingUcs = existingUcs.stream()
                .filter(uc -> uc.getBusinessModule() != null && uc.getBusinessModule().getId().equals(moduleId))
                .collect(Collectors.toList());
        }
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
                        if (actorName == null && rel.getSourceId() != null) {
                            actorName = actorIdToNameMap.get("actor_" + rel.getSourceId());
                        }
                        if (actorName == null && rel.getSourceId() != null && rel.getSourceId().startsWith("actor_")) {
                            actorName = actorIdToNameMap.get(rel.getSourceId().substring(6));
                        }
                        if (actorName != null) {
                            UseCaseActor uca = new UseCaseActor();
                            uca.setActorName(actorName);
                            
                            // Map back the ProjectActor relation
                            String finalPaIdStr = rel.getSourceId();
                            if (finalPaIdStr != null && finalPaIdStr.startsWith("actor_")) {
                                finalPaIdStr = finalPaIdStr.substring(6);
                            }
                            try {
                                if (finalPaIdStr != null) {
                                    Long paId = Long.parseLong(finalPaIdStr);
                                    projectActorRepository.findById(paId).ifPresent(uca::setProjectActor);
                                }
                            } catch (NumberFormatException ignored) {}

                            uc.addActor(uca);
                        }
                    }
                } else if ("include".equals(rel.getType())) {
                    if (uc.getId().toString().equals(rel.getSourceId())) {
                        UseCase target = updatedMap.get(rel.getTargetId());
                        if (target != null) includes.add(target.getId().toString()); // BUG 2 FIX: Store ID instead of Name
                    }
                } else if ("extends".equals(rel.getType())) {
                    if (uc.getId().toString().equals(rel.getSourceId())) {
                        UseCase target = updatedMap.get(rel.getTargetId());
                        if (target != null) extendsList.add(target.getId().toString()); // BUG 2 FIX: Store ID instead of Name
                    }
                }
            }
            uc.setIncludesList(includes);
            uc.setExtendsList(extendsList);
            useCaseRepository.save(uc);
        }
        
        // 4. UPDATE ACTOR INHERITANCE
        Map<String, String> childToParentMap = new HashMap<>();
        for (DiagramSyncRequest.DiagramRelationDTO rel : request.getRelations()) {
            if ("actor-generalization".equals(rel.getType())) {
                String childName = actorIdToNameMap.get(rel.getSourceId());
                if (childName == null && rel.getSourceId() != null) childName = actorIdToNameMap.get("actor_" + rel.getSourceId());
                if (childName == null && rel.getSourceId() != null && rel.getSourceId().startsWith("actor_")) childName = actorIdToNameMap.get(rel.getSourceId().substring(6));

                String parentName = actorIdToNameMap.get(rel.getTargetId());
                if (parentName == null && rel.getTargetId() != null) parentName = actorIdToNameMap.get("actor_" + rel.getTargetId());
                if (parentName == null && rel.getTargetId() != null && rel.getTargetId().startsWith("actor_")) parentName = actorIdToNameMap.get(rel.getTargetId().substring(6));

                if (childName != null && parentName != null) {
                    childToParentMap.put(childName, parentName);
                }
            }
        }
        for (ProjectActor pa : existingProjectActors) {
            String newParent = childToParentMap.get(pa.getName());
            if (newParent != null && !newParent.equals(pa.getInheritsFrom())) {
                pa.setInheritsFrom(newParent);
                projectActorRepository.save(pa);
            } else if (newParent == null && pa.getInheritsFrom() != null) {
                // If there's no relation in the diagram, but they had one before, clear it? 
                // Only if it's currently on the diagram. Let's just clear it if it was linked in this sync.
                if (request.getActors().stream().anyMatch(a -> a.getName().equals(pa.getName()))) {
                    pa.setInheritsFrom(null);
                    projectActorRepository.save(pa);
                }
            }
        }

        if (moduleId == null) {
            deleteMissingActors(existingProjectActors, new java.util.ArrayList<>(linkedActorNames), request.getActors());
        }
        
        return idMappings;
    }

    private void deleteMissingActors(List<ProjectActor> existingProjectActors, List<String> linkedActorNames, List<DiagramSyncRequest.DiagramActorDTO> requestActors) {
        // Hybrid Deletion of missing actors
        for (ProjectActor pa : existingProjectActors) {
            boolean inPayload = requestActors.stream().anyMatch(a -> a.getName().equals(pa.getName()));
            if (!inPayload && !pa.isDeleted()) {
                boolean wasLinked = linkedActorNames.contains(pa.getName());
                if (wasLinked) {
                    pa.setDeleted(true);
                    projectActorRepository.save(pa);
                } else {
                    projectActorRepository.delete(pa);
                }
            }
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
    public Object getDiagramLayout(Long projectId, Long moduleId) {
        ProjectDiagram diagram;
        if (moduleId != null) {
            diagram = projectDiagramRepository.findFirstByProjectIdAndModuleIdOrderByUpdatedAtDesc(projectId, moduleId).orElse(null);
        } else {
            diagram = projectDiagramRepository.findFirstByProjectIdAndModuleIdIsNullOrderByUpdatedAtDesc(projectId).orElse(null);
        }
        
        if (diagram == null) {
            return Map.of("layoutData", "{}", "imageBase64", "");
        }
        return Map.of(
            "layoutData", diagram.getLayoutData() != null ? diagram.getLayoutData() : "{}",
            "imageBase64", diagram.getImageBase64() != null ? diagram.getImageBase64() : ""
        );
    }

    @Override
    @Transactional
    public void saveDiagramLayout(Long projectId, Long moduleId, org.example.backend.dto.DiagramSaveRequest request) {
        ProjectDiagram diagram;
        if (moduleId != null) {
            diagram = projectDiagramRepository.findFirstByProjectIdAndModuleIdOrderByUpdatedAtDesc(projectId, moduleId)
                    .orElseGet(() -> {
                        ProjectDiagram newDiagram = new ProjectDiagram();
                        newDiagram.setProjectId(projectId);
                        newDiagram.setModuleId(moduleId);
                        return newDiagram;
                    });
        } else {
            diagram = projectDiagramRepository.findFirstByProjectIdAndModuleIdIsNullOrderByUpdatedAtDesc(projectId)
                    .orElseGet(() -> {
                        ProjectDiagram newDiagram = new ProjectDiagram();
                        newDiagram.setProjectId(projectId);
                        return newDiagram;
                    });
        }
        diagram.setProjectId(projectId);
        diagram.setLayoutData(request.getLayoutData());
        if (request.getImageBase64() != null) {
            diagram.setImageBase64(request.getImageBase64());
        }
        projectDiagramRepository.save(diagram);
    }

    private String resolveUseCaseIdRobustly(String targetName, Map<String, String> map) {
        if (targetName == null || targetName.trim().isEmpty()) return null;
        String cleanTarget = targetName.trim().toLowerCase();
        String targetId = map.get(cleanTarget);
        if (targetId != null) return targetId;
        
        cleanTarget = cleanTarget.replaceFirst("^uc-\\d+\\s*:\\s*", "").trim();
        targetId = map.get(cleanTarget);
        if (targetId != null) return targetId;
        
        for (Map.Entry<String, String> entry : map.entrySet()) {
            if (entry.getKey().length() > 4 && (cleanTarget.contains(entry.getKey()) || entry.getKey().contains(cleanTarget))) {
                return entry.getValue();
            }
        }
        return null;
    }
}
