package org.example.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.SystemRole;
import org.example.backend.entity.ProjectRole;
import org.example.backend.repository.SystemRoleRepository;
import org.example.backend.repository.ProjectRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final SystemRoleRepository roleRepository;
    private final ProjectRoleRepository projectRoleRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info(" Starting database seeding check via DataInitializer...");
        
        // 1. Seed System Roles
        List<String> defaultRoles = List.of("USER", "ADMIN", "MENTOR");

        for (String roleName : defaultRoles) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                SystemRole newRole = SystemRole.builder()
                        .name(roleName)
                        .description("Default system role for " + roleName.toLowerCase())
                        .build();
                roleRepository.save(newRole);
                log.info(" Created default system role: {}", roleName);
            } else {
                log.info(" Default system role '{}' already exists. Skipping...", roleName);
            }
        }

        // 2. Seed Project Roles
        List<String> defaultProjectRoles = List.of("PROJECT_LEADER", "MEMBER", "MENTOR");

        for (String roleName : defaultProjectRoles) {
            if (projectRoleRepository.findByName(roleName).isEmpty()) {
                ProjectRole newRole = ProjectRole.builder()
                        .name(roleName)
                        .description("Default project role for " + roleName.toLowerCase().replace("_", " "))
                        .build();
                projectRoleRepository.save(newRole);
                log.info(" Created default project role: {}", roleName);
            } else {
                log.info(" Default project role '{}' already exists. Skipping...", roleName);
            }
        }
        log.info(" Database seeding check finished successfully.");

    }
}
