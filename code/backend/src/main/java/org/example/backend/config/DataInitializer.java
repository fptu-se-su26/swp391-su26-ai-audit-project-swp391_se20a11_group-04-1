package org.example.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.SystemRole;
import org.example.backend.entity.ProjectRole;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.UserProfile;
import org.example.backend.entity.VerifyStatus;
import org.example.backend.repository.SystemRoleRepository;
import org.example.backend.repository.ProjectRoleRepository;
import org.example.backend.repository.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final SystemRoleRepository roleRepository;
    private final ProjectRoleRepository projectRoleRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

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
        List<String> defaultProjectRoles = List.of("LEADER", "MEMBER", "MENTOR");

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

        // 3. Seed default Admin account
        String adminUsername = "admin";
        String adminEmail = "admin@devtrack.local";
        String adminPassword = "Admin@123!";

        java.util.Optional<UserAccount> existingAdmin = userAccountRepository.findByUsername(adminUsername);
        if (existingAdmin.isEmpty()) {
            SystemRole adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new IllegalStateException("ADMIN role not found"));

            UserAccount adminAccount = new UserAccount();
            adminAccount.setUsername(adminUsername);
            adminAccount.setEmail(adminEmail);
            adminAccount.setPasswordHash(passwordEncoder.encode(adminPassword));
            adminAccount.setSystemRole(adminRole);
            adminAccount.setActive(true);
            adminAccount.setVerifyStatus(VerifyStatus.VERIFIED);

            UserProfile adminProfile = UserProfile.builder()
                    .fullName("System Administrator")
                    .build();
            adminAccount.setProfile(adminProfile);

            userAccountRepository.save(adminAccount);
            log.info(" Created default admin account: username='{}', email='{}'", adminUsername, adminEmail);
        } else {
            // Fix existing admin: reset password and ensure VERIFIED
            UserAccount admin = existingAdmin.get();
            boolean needsUpdate = false;

            if (admin.getVerifyStatus() != VerifyStatus.VERIFIED) {
                admin.setVerifyStatus(VerifyStatus.VERIFIED);
                needsUpdate = true;
                log.info(" Fixed admin verify_status → VERIFIED");
            }
            if (!admin.isActive()) {
                admin.setActive(true);
                needsUpdate = true;
                log.info(" Fixed admin is_active → true");
            }
            // Always reset password to ensure it's correct
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            needsUpdate = true;

            if (needsUpdate) {
                userAccountRepository.save(admin);
                log.info(" Admin account '{}' updated (password reset, status fixed).", adminUsername);
            }
        }
    }
}
