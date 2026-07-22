package org.example.backend.service.impl;

import org.example.backend.dto.RtmMatrixResponse;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectType;
import org.example.backend.entity.SystemRole;
import org.example.backend.entity.ProjectRole;
import org.example.backend.entity.UserAccount;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.RtmService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@SpringBootTest
@DisplayName("RTM Engine Benchmark Test - Self-Contained")
public class RtmBenchmarkTest {

    @Autowired
    private RtmService rtmService;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Test
    @Transactional
    public void runRtmBenchmark() {
        System.out.println("\n========================================================");
        System.out.println("   BAT DAU BENCHMARK HIEU NANG RTM (KHOA HOC & DO THAT) ");
        System.out.println("========================================================");

        // 1. DONG KHOI TAO NGUOI DUNG VA DU AN (Khong hardcode ID)
        UserAccount user = userAccountRepository.findAll().stream().findFirst().orElseGet(() -> {
            SystemRole defaultRole = entityManager.createQuery("SELECT sr FROM SystemRole sr", SystemRole.class)
                    .getResultList().stream().findFirst().orElse(null);
            UserAccount newUser = UserAccount.builder()
                    .username("rtm-benchmarker")
                    .email("rtm@benchmark.com")
                    .passwordHash("hashed_password")
                    .systemRole(defaultRole)
                    .build();
            return userAccountRepository.save(newUser);
        });

        Project project = projectRepository.findAll().stream().findFirst().orElseGet(() -> {
            Project newProject = Project.builder()
                    .name("Dynamic Benchmark Project")
                    .description("Auto-generated for RTM benchmark")
                    .type(ProjectType.WEB_APP)
                    .startDate(LocalDate.now().minusDays(5))
                    .deadline(LocalDate.now().plusDays(20))
                    .createdBy(user)
                    .build();
            return projectRepository.save(newProject);
        });

        Long projectId = project.getId();
        Long userId = user.getId();
        
        System.out.printf("Su dung Project ID: %d, User ID: %d cho phep do.%n", projectId, userId);

        // Lien ket project member de pass validation check "You do not have access to this project."
        ProjectRole defaultProjRole = entityManager.createQuery("SELECT pr FROM ProjectRole pr", ProjectRole.class)
                .getResultList().stream().findFirst().orElse(null);
        if (defaultProjRole != null) {
            Number count = (Number) entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM project_members WHERE project_id = :projectId AND user_id = :userId")
                .setParameter("projectId", projectId)
                .setParameter("userId", userId)
                .getSingleResult();
            if (count.intValue() == 0) {
                Query insertMember = entityManager.createNativeQuery(
                    "INSERT INTO project_members (project_id, user_id, project_role_id, joined_at) " +
                    "VALUES (:projectId, :userId, :roleId, CURRENT_TIMESTAMP)"
                );
                insertMember.setParameter("projectId", projectId);
                insertMember.setParameter("userId", userId);
                insertMember.setParameter("roleId", defaultProjRole.getId());
                insertMember.executeUpdate();
                System.out.println("Lien ket ProjectMember hoan tat!");
            }
        }

        // 2. CHUAN BI DATA LON (Insert N=50 Requirements va cac thuc the lien quan)
        System.out.println("Dang khoi tao bo du lieu N=50 Requirements de do luong...");
        List<Long> mockReqIds = new ArrayList<>();
        
        for (int i = 1; i <= 50; i++) {
            String reqCode = "REQ-BENCH-" + i;
            String reqTitle = "Mock Requirement for benchmarking " + i;
            Query insertReq = entityManager.createNativeQuery(
                "INSERT INTO requirements (project_id, req_code, title, type, priority, status, evidence_required, owner_id, created_by, acceptance_criteria) " +
                "VALUES (:projectId, :reqCode, :title, CAST('FUNCTIONAL' AS requirement_type_enum), 'MEDIUM', 'IN_PROGRESS', true, :userId, :userId, '[]'::jsonb) RETURNING id"
            );
            insertReq.setParameter("projectId", projectId);
            insertReq.setParameter("reqCode", reqCode);
            insertReq.setParameter("title", reqTitle);
            insertReq.setParameter("userId", userId);
            
            Long reqId = ((Number) insertReq.getSingleResult()).longValue();
            mockReqIds.add(reqId);

            // Insert 2 Tasks cho moi Requirement
            for (int t = 1; t <= 2; t++) {
                Query insertTask = entityManager.createNativeQuery(
                    "INSERT INTO tasks (project_id, requirement_id, title, status, priority, type, created_by, start_date, deadline) " +
                    "VALUES (:projectId, :reqId, :title, CAST('DONE' AS task_status_enum), CAST('MEDIUM' AS priority_enum), CAST('DEVELOPMENT' AS task_type_enum), :userId, CURRENT_DATE, CURRENT_DATE + 10)"
                );
                insertTask.setParameter("projectId", projectId);
                insertTask.setParameter("reqId", reqId);
                insertTask.setParameter("title", "Mock Task " + t + " for Req " + i);
                insertTask.setParameter("userId", userId);
                insertTask.executeUpdate();
            }

            // Insert 2 Test Cases cho moi Requirement (setting expected_result and created_by to avoid null constraints)
            for (int tc = 1; tc <= 2; tc++) {
                Query insertTestCase = entityManager.createNativeQuery(
                    "INSERT INTO test_cases (project_id, requirement_id, tc_code, title, status, type, expected_result, created_by) " +
                    "VALUES (:projectId, :reqId, :tcCode, :title, CAST('PASS' AS test_case_status_enum), CAST('UNIT' AS test_type_enum), 'Mock expected result', :userId)"
                );
                insertTestCase.setParameter("projectId", projectId);
                insertTestCase.setParameter("reqId", reqId);
                insertTestCase.setParameter("tcCode", "TC-BENCH-" + i + "-" + tc);
                insertTestCase.setParameter("title", "Mock Test Case " + tc + " for Req " + i);
                insertTestCase.setParameter("userId", userId);
                insertTestCase.executeUpdate();
            }
        }
        
        System.out.printf("Cai dat thanh cong N = %d Requirements va 200 thuc the lien quan trong Transaction.%n", mockReqIds.size());

        // 3. WARMUP JVM & DATABASE CONNECTION (50 lan chay thu)
        System.out.println("Dang chay JVM Warmup de JIT Compiler on dinh...");
        for (int i = 0; i < 50; i++) {
            rtmService.getMatrix(projectId, userId);
            runSimulatedSlowPath(projectId, mockReqIds);
        }
        System.out.println("Warmup hoan tat!");

        // 4. BENCHMARK PHUONG PHAP CHAM (JPA N+1 Query - Lap 100 lan lay trung binh)
        System.out.println("\nExecuting Slow Path (Simulated JPA N+1) 100 times...");
        long totalSlowTime = 0;
        int totalSlowQueries = 1 + (4 * mockReqIds.size());
        
        for (int i = 0; i < 100; i++) {
            long start = System.nanoTime();
            runSimulatedSlowPath(projectId, mockReqIds);
            long end = System.nanoTime();
            totalSlowTime += (end - start);
        }
        double avgSlowTimeMs = (totalSlowTime / 100.0) / 1_000_000.0;
        System.out.printf("Average Latency (Slow Path over 100 runs): %.2f ms%n", avgSlowTimeMs);

        // 5. BENCHMARK PHUONG PHAP NHANH (CTE Native Query - Lap 100 lan lay trung binh)
        System.out.println("Executing Fast Path (CTE Query) 100 times...");
        long totalFastTime = 0;
        
        for (int i = 0; i < 100; i++) {
            long start = System.nanoTime();
            rtmService.getMatrix(projectId, userId);
            long end = System.nanoTime();
            totalFastTime += (end - start);
        }
        double avgFastTimeMs = (totalFastTime / 100.0) / 1_000_000.0;
        System.out.printf("Average Latency (Fast Path over 100 runs): %.2f ms%n", avgFastTimeMs);

        // 6. HIEN THI KET QUA SO SANH
        double speedupPercent = ((avgSlowTimeMs - avgFastTimeMs) / avgSlowTimeMs) * 100;
        double speedupMultiplier = avgSlowTimeMs / avgFastTimeMs;

        System.out.println("\n================ KET QUA SO SANH RTM ================");
        System.out.printf("So queries gui den DB: %d queries -> con 1 query (Giam %.1f%%)%n", totalSlowQueries, ((totalSlowQueries - 1.0) / totalSlowQueries) * 100);
        System.out.printf("Average Latency: %.2f ms -> %.2f ms%n", avgSlowTimeMs, avgFastTimeMs);
        System.out.printf("Hieu nang tang gap: %.2f lan (Cai thien %.2f%%)%n", speedupMultiplier, speedupPercent);
        System.out.println("========================================================\n");
    }

    private void runSimulatedSlowPath(Long projectId, List<Long> reqIds) {
        Query q1 = entityManager.createNativeQuery("SELECT * FROM requirements WHERE project_id = :projectId");
        q1.setParameter("projectId", projectId);
        q1.getResultList();

        for (Long reqId : reqIds) {
            Query qTasks = entityManager.createNativeQuery("SELECT * FROM tasks WHERE requirement_id = :reqId");
            qTasks.setParameter("reqId", reqId);
            qTasks.getResultList();

            Query qTests = entityManager.createNativeQuery("SELECT * FROM test_cases WHERE requirement_id = :reqId");
            qTests.setParameter("reqId", reqId);
            qTests.getResultList();

            Query qBugs = entityManager.createNativeQuery(
                "SELECT b.* FROM bug_reports b " +
                "LEFT JOIN tasks t ON t.id = b.related_task_id " +
                "WHERE t.requirement_id = :reqId"
            );
            qBugs.setParameter("reqId", reqId);
            qBugs.getResultList();

            Query qEvidences = entityManager.createNativeQuery(
                "SELECT e.* FROM evidence e " +
                "JOIN evidence_links el ON e.id = el.evidence_id " +
                "WHERE el.entity_id = :reqId AND el.entity_type = 'REQUIREMENT'"
            );
            qEvidences.setParameter("reqId", reqId);
            qEvidences.getResultList();
        }
    }
}
