package org.example.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.entity.GitHubIntegration;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectType;
import org.example.backend.entity.SystemRole;
import org.example.backend.entity.UserAccount;
import org.example.backend.service.github.code.GitHubPushEventHandler;
import org.example.backend.service.github.core.GitHubIntegrationService;
import org.example.backend.service.github.impl.GitHubWebhookServiceImpl;
import org.example.backend.repository.GitHubIntegrationRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.github.core.GitHubWebhookDispatcher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import jakarta.persistence.EntityManager;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@SpringBootTest
@DisplayName("GitHub Webhook Benchmark Test - Self-Contained")
public class WebhookBenchmarkTest {

    @Autowired
    private GitHubWebhookServiceImpl webhookService;

    @Autowired
    private GitHubPushEventHandler pushEventHandler;

    @Autowired
    private GitHubIntegrationService integrationService;

    @Autowired
    private GitHubIntegrationRepository integrationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private GitHubWebhookDispatcher dispatcher; // Mocking dispatcher to avoid background async thread race conditions

    @Test
    public void runWebhookBenchmark() throws Exception {
        System.out.println("\n========================================================");
        System.out.println("   BAT DAU BENCHMARK HIEU NANG WEBHOOK (KHOA HOC & DO THAT)");
        System.out.println("========================================================");

        GitHubIntegration integration = null;
        Project project = null;
        
        try {
            // 1. DONG KHOI TAO NGUOI DUNG VA DU AN (Khong hardcode ID)
            UserAccount defaultUser = userAccountRepository.findAll().stream().findFirst().orElseGet(() -> {
                SystemRole defaultRole = entityManager.createQuery("SELECT sr FROM SystemRole sr", SystemRole.class)
                        .getResultList().stream().findFirst().orElse(null);
                UserAccount newUser = UserAccount.builder()
                        .username("webhook-benchmarker")
                        .email("webhook@benchmark.com")
                        .passwordHash("hashed_password")
                        .systemRole(defaultRole)
                        .build();
                return userAccountRepository.save(newUser);
            });

            project = Project.builder()
                    .name("Webhook Benchmark Project")
                    .description("Project created dynamically for benchmarking")
                    .type(ProjectType.WEB_APP)
                    .startDate(LocalDate.now().minusDays(10))
                    .deadline(LocalDate.now().plusDays(30))
                    .createdBy(defaultUser)
                    .build();
            project = projectRepository.save(project);

            String secret = "webhook-bench-secret-token-key-value-987654321";
            String encryptedSecret = integrationService.encryptToken(secret);

            integration = GitHubIntegration.builder()
                    .project(project)
                    .repoOwner("bench-owner")
                    .repoName("bench-repo")
                    .webhookSecretEncrypted(encryptedSecret)
                    .connectedBy(defaultUser)
                    .build();
            integration = integrationRepository.save(integration);

            System.out.printf("Su dung Project ID: %d, User ID: %d cho phep do webhook.%n", project.getId(), defaultUser.getId());

            // 2. CHUAN BI PAYLOAD PUSH THUC TE (Chua 3 commit de upsert DB thuc te)
            String payloadJson = """
                {
                  "ref": "refs/heads/main",
                  "pusher": {
                    "name": "benchmarker"
                  },
                  "repository": {
                    "name": "bench-repo",
                    "owner": {
                      "login": "bench-owner"
                    }
                  },
                  "commits": [
                    {
                      "id": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a01",
                      "message": "feat: benchmark commit 1\\n\\nDetailed description of commit 1",
                      "timestamp": "2026-07-17T03:19:04Z",
                      "author": {
                        "name": "benchmarker",
                        "email": "benchmarker@example.com"
                      }
                    },
                    {
                      "id": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a02",
                      "message": "fix: benchmark commit 2\\n\\nDetailed description of commit 2",
                      "timestamp": "2026-07-17T03:20:00Z",
                      "author": {
                        "name": "benchmarker",
                        "email": "benchmarker@example.com"
                      }
                    },
                    {
                      "id": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a03",
                      "message": "docs: benchmark commit 3\\n\\nDetailed description of commit 3",
                      "timestamp": "2026-07-17T03:21:00Z",
                      "author": {
                        "name": "benchmarker",
                        "email": "benchmarker@example.com"
                      }
                    }
                  ]
                }
                """;
            byte[] payloadBytes = payloadJson.getBytes(StandardCharsets.UTF_8);
            Map<String, Object> payloadMap = objectMapper.readValue(payloadJson, Map.class);

            // Tao signature header hop le
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payloadBytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String computedSignature = "sha256=" + hexString.toString();

            // 3. WARMUP JVM & DATABASE CONNECTION (50 lan chay thu)
            System.out.println("Dang chay JVM Warmup de JIT Compiler on dinh...");
            for (int i = 0; i < 50; i++) {
                String deliveryId = UUID.randomUUID().toString();
                // Test luong async
                webhookService.handleWebhook(computedSignature, deliveryId, "push", payloadBytes);
                // Test luong sync
                pushEventHandler.handlePushEvent(payloadMap, integration);
            }
            System.out.println("Warmup hoan tat!");

            // 4. BENCHMARK PHUONG PHAP CHAM (Dong bo - HTTP Thread phai tu minh ghi DB va chay business logic)
            System.out.println("\nExecuting Webhook synchronously (Sync HTTP Thread) 100 times...");
            long totalSyncTime = 0;
            
            for (int i = 0; i < 100; i++) {
                String deliveryId = UUID.randomUUID().toString();
                long start = System.nanoTime();
                
                // Sync = handleWebhook (Verify HMAC & save pending) + handlePushEvent (DB queries + Audit logs)
                webhookService.handleWebhook(computedSignature, deliveryId, "push", payloadBytes);
                pushEventHandler.handlePushEvent(payloadMap, integration);
                
                long end = System.nanoTime();
                totalSyncTime += (end - start);
            }
            double avgSyncTimeMs = (totalSyncTime / 100.0) / 1_000_000.0;
            System.out.printf("Average Latency (Sync HTTP Thread over 100 runs): %.2f ms%n", avgSyncTimeMs);

            // 5. BENCHMARK PHUONG PHAP NHANH (Bat dong bo - HTTP Thread chi verify roi thoat ngay)
            System.out.println("Executing Webhook asynchronously (Async HTTP Thread) 100 times...");
            long totalAsyncTime = 0;
            
            for (int i = 0; i < 100; i++) {
                String deliveryId = UUID.randomUUID().toString();
                long start = System.nanoTime();
                
                // Async = handleWebhook (Trig mock async dispatcher va tra ve ket qua ngay)
                webhookService.handleWebhook(computedSignature, deliveryId, "push", payloadBytes);
                
                long end = System.nanoTime();
                totalAsyncTime += (end - start);
            }
            double avgAsyncTimeMs = (totalAsyncTime / 100.0) / 1_000_000.0;
            System.out.printf("Average Latency (Async HTTP Thread over 100 runs): %.2f ms%n", avgAsyncTimeMs);

            // 6. HIEN THI KET QUA SO SANH
            double speedupPercent = ((avgSyncTimeMs - avgAsyncTimeMs) / avgSyncTimeMs) * 100;
            double speedupMultiplier = avgSyncTimeMs / avgAsyncTimeMs;

            System.out.println("\n================ KET QUA SO SANH WEBHOOK ================");
            System.out.printf("Thoi gian giu HTTP Connection: %.2f ms (Sync) -> %.2f ms (Async)%n", avgSyncTimeMs, avgAsyncTimeMs);
            System.out.printf("HTTP Thread duoc giai phong nhanh gap: %.2f lan (Tieu ton %.2f%% it thoi gian hon)%n", speedupMultiplier, speedupPercent);
            System.out.println("========================================================\n");
            
        } finally {
            // Manual cleanup in reverse order to avoid FK constraint errors
            System.out.println("Cleaning up benchmark integration and project data from DB...");
            try {
                if (integration != null && integration.getId() != null) {
                    integrationRepository.deleteById(integration.getId());
                }
            } catch (Exception ex) {
                System.out.println("[WARNING] Failed to delete benchmark integration: " + ex.getMessage());
            }
            try {
                if (project != null && project.getId() != null) {
                    projectRepository.deleteById(project.getId());
                }
            } catch (Exception ex) {
                System.out.println("[WARNING] Failed to delete benchmark project: " + ex.getMessage());
            }
            System.out.println("Cleanup completed successfully.");
        }
    }
}
