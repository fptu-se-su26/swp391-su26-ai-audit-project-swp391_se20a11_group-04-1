package org.example.backend.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.*;
import org.example.backend.exception.BadRequestException;
import org.example.backend.repository.*;
import org.example.backend.service.ProjectService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Slf4j
@Disabled("Requires a running Redis instance on localhost:6379 for distributed lock concurrency validation.")
public class ProjectServiceConcurrencyTest {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private AcademicContextRepository academicContextRepository;

    @Autowired
    private SystemRoleRepository systemRoleRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMemberRepository projectMemberRepository;

    @Autowired
    private ProjectRoleRepository projectRoleRepository;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private Long testClassroomId;
    private Long testProjectId;
    private List<Long> testUserIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        SystemRole defaultRole = systemRoleRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    SystemRole role = new SystemRole();
                    role.setName("TEST_ROLE");
                    return systemRoleRepository.save(role);
                });

        ProjectRole memberRole = projectRoleRepository.findByName("MEMBER")
                .orElseGet(() -> {
                    ProjectRole role = new ProjectRole();
                    role.setName("MEMBER");
                    return projectRoleRepository.save(role);
                });

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        // 1. Tạo Owner (Mentor / Creator)
        UserAccount owner = new UserAccount();
        owner.setUsername("owner_proj_" + suffix);
        owner.setEmail("owner_proj_" + suffix + "@test.com");
        owner.setPasswordHash("password");
        owner.setSystemRole(defaultRole);
        owner = userAccountRepository.save(owner);
        testUserIds.add(owner.getId());

        // 2. Tạo Classroom (AcademicContext)
        AcademicContext ac = AcademicContext.builder()
                .subject("Test Concurrency Proj " + suffix)
                .semester(AcademicSeason.SPRING)
                .academicYear("2026")
                .owner(owner)
                .maxMembers(30)
                .startDate(LocalDate.now())
                .enrolledStudents(new ArrayList<>())
                .build();
        ac.getEnrolledStudents().add(owner);

        // 3. Tạo 14 học sinh cho lớp học
        List<UserAccount> classStudents = new ArrayList<>();
        for (int i = 0; i < 14; i++) {
            UserAccount student = new UserAccount();
            student.setUsername("student_p_" + i + "_" + suffix);
            student.setEmail("student_p_" + i + "_" + suffix + "@test.com");
            student.setPasswordHash("password");
            student.setSystemRole(defaultRole);
            student = userAccountRepository.save(student);
            testUserIds.add(student.getId());
            ac.getEnrolledStudents().add(student);
            classStudents.add(student);
        }

        ac = academicContextRepository.save(ac);
        testClassroomId = ac.getId();

        // 4. Tạo Project với maxMembers = 5
        Project project = Project.builder()
                .name("Concurrency Project " + suffix)
                .description("Test concurrency")
                .type(ProjectType.WEB_APP)
                .academicContext(ac)
                .startDate(LocalDate.now())
                .deadline(LocalDate.now().plusMonths(3))
                .status(ProjectStatus.PLANNING)
                .createdBy(owner)
                .maxMembers(5)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        project = projectRepository.save(project);
        testProjectId = project.getId();

        // 5. Thêm trước 4 thành viên vào Project (còn trống đúng 1 chỗ)
        List<ProjectMember> membersList = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            ProjectMember pm = ProjectMember.builder()
                    .project(project)
                    .user(classStudents.get(i))
                    .role(memberRole)
                    .joinedAt(LocalDateTime.now())
                    .build();
            pm = projectMemberRepository.save(pm);
            membersList.add(pm);
        }
        project.setMembers(membersList);
        projectRepository.save(project);

        // 6. Nhận diện 10 học sinh còn lại làm đối thủ tranh cử slot cuối cùng
        // Đã add vào testUserIds trước đó. Các đối thủ bắt đầu từ index 4 tới 13 của classStudents
        // (Vị trí 4 -> 13 tương đương 10 học sinh)
    }

    @AfterEach
    void tearDown() {
        if (testProjectId != null) {
            projectRepository.deleteById(testProjectId);
            stringRedisTemplate.delete("lock:project_join:" + testProjectId);
        }
        if (testClassroomId != null) {
            academicContextRepository.deleteById(testClassroomId);
        }
        for (Long id : testUserIds) {
            try {
                userAccountRepository.deleteById(id);
            } catch (Exception e) {
                // Ignore key dependency issues on cascading deletions if any
            }
        }
        testUserIds.clear();
    }

    @Test
    void testJoinProjectConcurrency() throws InterruptedException {
        int numberOfThreads = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        // 10 competitors are users from index 5 to 14 of testUserIds (the students created in setup)
        // testUserIds[0] = owner
        // testUserIds[1..4] = 4 students already in project
        // testUserIds[5..14] = 10 students not in project
        for (int i = 0; i < numberOfThreads; i++) {
            final Long competitorUserId = testUserIds.get(i + 5);
            executorService.submit(() -> {
                try {
                    readyLatch.countDown();
                    startLatch.await();

                    projectService.joinProject(testProjectId, competitorUserId);
                    successCount.incrementAndGet();
                } catch (BadRequestException e) {
                    failCount.incrementAndGet();
                    log.info("Blocked as expected: {}", e.getMessage());
                } catch (Exception e) {
                    log.error("Unexpected error: ", e);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await();
        log.info("START CONCURRENCY TEST FOR PROJECT JOIN WITH 10 THREADS CONCURRENTLY!");
        startLatch.countDown();
        doneLatch.await();

        executorService.shutdown();

        log.info("Number of users successfully joined: {}", successCount.get());
        log.info("Number of users blocked (lock or limit reached): {}", failCount.get());

        // Assertions
        // Exactly 1 user must successfully grab the last seat
        assertEquals(1, successCount.get(), "Only exactly 1 user should succeed");
        assertEquals(9, failCount.get(), "9 users must fail");

        // Verify total project size is exactly maxMembers (5)
        transactionTemplate.executeWithoutResult(status -> {
            Project resultProject = projectRepository.findById(testProjectId).orElseThrow();
            // Count members excluding Mentor if mentor role was somehow added
            long finalSize = resultProject.getMembers().stream()
                    .filter(pm -> pm.getRole() != null && !"MENTOR".equalsIgnoreCase(pm.getRole().getName()))
                    .count();
            assertEquals(5, finalSize, "Total members in project must be exactly 5");
        });
    }
}
