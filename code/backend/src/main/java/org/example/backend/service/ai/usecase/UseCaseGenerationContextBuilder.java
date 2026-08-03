package org.example.backend.service.ai.usecase;

import org.example.backend.dto.ai.UseCaseGenerationContext;
import org.example.backend.entity.BusinessModule;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectActor;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.UseCase;
import org.example.backend.repository.BusinessModuleRepository;
import org.example.backend.repository.ProjectActorRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UseCaseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UseCaseGenerationContextBuilder {

    private final RequirementRepository requirementRepository;
    private final BusinessModuleRepository businessModuleRepository;
    private final ProjectActorRepository projectActorRepository;
    private final UseCaseRepository useCaseRepository;

    @Autowired
    public UseCaseGenerationContextBuilder(RequirementRepository requirementRepository, 
                                           BusinessModuleRepository businessModuleRepository,
                                           ProjectActorRepository projectActorRepository,
                                           UseCaseRepository useCaseRepository) {
        this.requirementRepository = requirementRepository;
        this.businessModuleRepository = businessModuleRepository;
        this.projectActorRepository = projectActorRepository;
        this.useCaseRepository = useCaseRepository;
    }

    public UseCaseGenerationContext buildContext(Project project, Long moduleId, List<Long> requirementIds) {
        BusinessModule targetModule = null;
        if (moduleId != null) {
            targetModule = businessModuleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Target module not found"));
            
            if (!targetModule.getProject().getId().equals(project.getId())) {
                throw new RuntimeException("Module does not belong to this project");
            }
        }
        
        List<Requirement> reqs = requirementRepository.findAllById(requirementIds);
        for (Requirement r : reqs) {
            if (!r.getProject().getId().equals(project.getId())) {
                throw new RuntimeException("Requirement " + r.getId() + " does not belong to this project");
            }
            // NOTE: Bỏ check "belongs to different module" vì khi gen AUTO_PROJECT,
            // frontend gửi tất cả req IDs, nhiều req đã có module khác → không nên block
        }

        List<ProjectActor> existingActors = projectActorRepository.findByProjectIdAndIsDeletedFalse(project.getId());
        List<UseCase> existingUseCases = useCaseRepository.findByProjectId(project.getId());
        List<BusinessModule> projectModules = businessModuleRepository.findByProjectOrderByCreatedAtAsc(project);

        return UseCaseGenerationContext.builder()
                .project(project)
                .targetModule(targetModule)
                .moduleRequirements(reqs)
                .existingActors(existingActors)
                .existingUseCases(existingUseCases)
                .contextPriorities(List.of())
                .projectModules(projectModules)
                .build();
    }
}
