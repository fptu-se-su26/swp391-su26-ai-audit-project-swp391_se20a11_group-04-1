package org.example.backend.dto.ai;

import lombok.Builder;
import lombok.Data;
import org.example.backend.entity.BusinessModule;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectActor;
import org.example.backend.entity.Requirement;
import org.example.backend.entity.UseCase;

import java.util.List;

@Data
@Builder
public class UseCaseGenerationContext {
    private Project project;
    private BusinessModule targetModule;
    private List<Requirement> moduleRequirements;
    private List<ProjectActor> existingActors;
    private List<UseCase> existingUseCases;
    private List<String> contextPriorities;
}
