package org.example.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.SystemRole;
import org.example.backend.repository.SystemRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final SystemRoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 Starting database seeding check via DataInitializer...");
        
        List<String> defaultRoles = List.of("USER", "ADMIN", "MENTOR");
        
        for (String roleName : defaultRoles) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                SystemRole newRole = SystemRole.builder()
                        .name(roleName)
                        .description("Default system role for " + roleName.toLowerCase())
                        .build();
                roleRepository.save(newRole);
                log.info("➕ Created default system role: {}", roleName);
            } else {
                log.info("⏭️ Default system role '{}' already exists. Skipping...", roleName);
            }
        }
        
        log.info("✅ Database seeding check finished successfully.");
    }
}
