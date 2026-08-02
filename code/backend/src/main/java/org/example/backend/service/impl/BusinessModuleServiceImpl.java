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

    @Autowired
    private org.example.backend.repository.TaskRepository taskRepository;

    @Autowired
    private org.example.backend.repository.ProjectDiagramRepository projectDiagramRepository;

    @Autowired
    private org.example.backend.repository.RequirementRepository requirementRepository;

    @Autowired
    private org.example.backend.repository.ProjectMemberRepository projectMemberRepository;

    private void checkProjectPermission(Project project, Long userId) {
        // Use DB query instead of lazy-loading project.getMembers() to avoid proxy issues
        java.util.Optional<org.example.backend.entity.ProjectMember> member =
                projectMemberRepository.findByProjectIdAndUserId(project.getId(), userId);
        if (member.isEmpty()) {
            throw new BadRequestException("Only project leader can manage modules");
        }
        String roleName = member.get().getRole() != null ? member.get().getRole().getName().toUpperCase() : "";
        if (!roleName.contains("LEADER")) {
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

        // 1. Unlink all Requirements from this module (set module_id = NULL)
        List<org.example.backend.entity.Requirement> requirements = requirementRepository.findByBusinessModuleId(id);
        for (org.example.backend.entity.Requirement req : requirements) {
            req.setBusinessModule(null);
            requirementRepository.save(req);
        }

        // 2. Delete all Use Cases in this module (cascade delete, not just unlink)
        List<org.example.backend.entity.UseCase> useCases = useCaseRepository.findByBusinessModuleId(id);
        if (!useCases.isEmpty()) {
            // 2a. Collect UC IDs for cleanup
            List<Long> ucIds = useCases.stream().map(org.example.backend.entity.UseCase::getId).collect(java.util.stream.Collectors.toList());

            // 2b. Unlink tasks.use_case_id (raw FK not mapped in Task entity — use native query)
            taskRepository.unlinkUseCaseIds(ucIds);

            // 2c. Clear ManyToMany join table requirement_use_cases before deleting UCs
            for (org.example.backend.entity.UseCase uc : useCases) {
                uc.getRequirements().clear();
                useCaseRepository.save(uc);
            }

            useCaseRepository.deleteAll(useCases);
        }

        // 3. Delete all Tasks associated with this module
        List<org.example.backend.entity.Task> tasks = taskRepository.findByBusinessModuleId(id);
        if (!tasks.isEmpty()) {
            taskRepository.deleteAll(tasks);
        }

        // 4. Delete ProjectDiagrams associated with this module
        projectDiagramRepository.deleteByModuleId(id);

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
