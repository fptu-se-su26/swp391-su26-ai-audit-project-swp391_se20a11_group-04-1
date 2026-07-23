package org.example.backend;

import org.example.backend.repository.UserAccountRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class ResetAdminPass {
    public static void main(String[] args) {
        ApplicationContext ctx = SpringApplication.run(BackendApplication.class, args);
        UserAccountRepository repo = ctx.getBean(UserAccountRepository.class);
        
        System.out.println("========== RESETTING ADMIN PASSWORD ==========");
        repo.findByUsernameOrEmail("admin").ifPresentOrElse(user -> {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
            String newHash = encoder.encode("123456");
            user.setPasswordHash(newHash);
            repo.save(user);
            System.out.println("Admin password successfully reset to: 123456");
        }, () -> {
            System.out.println("User 'admin' NOT FOUND!");
        });
        System.out.println("==============================================");
        System.exit(0);
    }
}
