package org.example.backend.service.impl;

import org.example.backend.dto.BusinessModuleRequest;
import org.example.backend.dto.BusinessModuleResponse;
import org.example.backend.entity.BusinessModule;
import org.example.backend.entity.Project;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.BusinessModuleRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.BusinessModuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BusinessModuleServiceImpl implements BusinessModuleService {

    @Autowired
    private BusinessModuleRepository businessModuleRepository;
    
    @Autowired
    private ProjectRepository projectRepository;
    
    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private org.example.backend.repository.UseCaseRepository useCaseRepository;

    private void checkProjectPermission(Project project, Long userId) {
        boolean isMember = project.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(userId));
        boolean isLeader = project.getCreatedBy().getId().equals(userId);
        if (!isMember && !isLeader) {
            throw new BadRequestException("User does not have access to this project");
        }
        if (!isLeader) {
            throw new BadRequestException("Only project leader can manage modules");
        }
    }

    private BusinessModuleResponse mapToResponse(BusinessModule module) {
        BusinessModuleResponse res = new BusinessModuleResponse();
        res.setId(module.getId());
        res.setProjectId(module.getProject().getId());
        res.setName(module.getName());
        res.setDescription(module.getDescription());
        res.setPriority(module.getPriority());
        res.setCreatedAt(module.getCreatedAt());
        res.setUpdatedAt(module.getUpdatedAt());
        
        if (module.getAssignee() != null) {
            res.setAssigneeId(module.getAssignee().getId());
            String fullName = (module.getAssignee().getProfile() != null && module.getAssignee().getProfile().getFullName() != null) 
                              ? module.getAssignee().getProfile().getFullName() 
                              : module.getAssignee().getUsername();
            res.setAssigneeName(fullName);
            res.setAssigneeUsername(module.getAssignee().getUsername());
            res.setAssigneeAvatar(module.getAssignee().getProfile() != null ? module.getAssignee().getProfile().getAvatarUrl() : null);
        }
        return res;
    }

    @Override
    @Transactional
    public BusinessModuleResponse createModule(Long projectId, BusinessModuleRequest request, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        checkProjectPermission(project, userId);

        if (businessModuleRepository.existsByProjectIdAndNameIgnoreCase(projectId, request.getName().trim())) {
            throw new BadRequestException("A module with this name already exists in the project");
        }

        BusinessModule module = new BusinessModule();
        module.setProject(project);
        module.setName(request.getName().trim());
        module.setDescription(request.getDescription());
        module.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        
        if (request.getAssigneeId() != null) {
            UserAccount assignee = userAccountRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getAssigneeId()));
            module.setAssignee(assignee);
        }
        
        BusinessModule saved = businessModuleRepository.save(module);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public BusinessModuleResponse updateModule(Long id, Long projectId, BusinessModuleRequest request, Long userId) {
        BusinessModule module = businessModuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + id));
        if (!module.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Module does not belong to specified project");
        }
        checkProjectPermission(module.getProject(), userId);

        if (businessModuleRepository.existsByProjectIdAndNameIgnoreCaseAndIdNot(projectId, request.getName().trim(), id)) {
            throw new BadRequestException("A module with this name already exists in the project");
        }

        module.setName(request.getName().trim());
        module.setDescription(request.getDescription());
        module.setPriority(request.getPriority() != null ? request.getPriority() : "MEDIUM");
        
        if (request.getAssigneeId() != null) {
            UserAccount assignee = userAccountRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getAssigneeId()));
            module.setAssignee(assignee);
        } else {
            module.setAssignee(null);
        }
        
        BusinessModule saved = businessModuleRepository.save(module);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deleteModule(Long id, Long projectId, Long userId) {
        BusinessModule module = businessModuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + id));
        if (!module.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Module does not belong to specified project");
        }
        checkProjectPermission(module.getProject(), userId);
        
        if (useCaseRepository.existsByBusinessModuleId(id)) {
            throw new BadRequestException("Cannot delete module because it contains Use Cases. Please reassign or delete them first.");
        }
        
        businessModuleRepository.delete(module);
    }

    @Override
    public List<BusinessModuleResponse> getModulesByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        
        return businessModuleRepository.findByProjectOrderByCreatedAtAsc(project).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BusinessModuleResponse assignMember(Long id, Long projectId, Long assigneeId, Long userId) {
        BusinessModule module = businessModuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + id));
        if (!module.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Module does not belong to specified project");
        }
        checkProjectPermission(module.getProject(), userId);
        
        if (assigneeId != null) {
            UserAccount assignee = userAccountRepository.findById(assigneeId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + assigneeId));
            module.setAssignee(assignee);
        } else {
            module.setAssignee(null);
        }
        
        BusinessModule saved = businessModuleRepository.save(module);
        return mapToResponse(saved);
    }
}
