import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.entity.UserAccount;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;

@SpringBootApplication(scanBasePackages = "org.example.backend")
@EnableJpaRepositories(
    basePackages = "org.example.backend.repository",
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "org\\.example\\.backend\\.repository\\.mongo\\..*"
    )
)
@EnableMongoRepositories(
    basePackages = "org.example.backend.repository.mongo"
)
@EnableRedisRepositories(
    basePackages = "org.example.backend.repository.redis"
)
public class ResetAdminPass {
    public static void main(String[] args) {
        ApplicationContext ctx = SpringApplication.run(ResetAdminPass.class, args);
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
