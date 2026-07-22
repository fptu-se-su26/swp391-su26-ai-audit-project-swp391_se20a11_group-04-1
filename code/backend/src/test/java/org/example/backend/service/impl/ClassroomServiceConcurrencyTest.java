package org.example.backend.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.AcademicContext;
import org.example.backend.entity.AcademicSeason;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.VerifyStatus;
import org.example.backend.exception.BadRequestException;
import org.example.backend.repository.AcademicContextRepository;
import org.example.backend.repository.SystemRoleRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.entity.SystemRole;
import org.example.backend.service.ClassroomService;
import org.example.backend.util.ClassroomTokenUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Slf4j
public class ClassroomServiceConcurrencyTest {

    @Autowired
    private ClassroomService classroomService;

    @Autowired
    private AcademicContextRepository academicContextRepository;

    @Autowired
    private SystemRoleRepository systemRoleRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private ClassroomTokenUtil classroomTokenUtil;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private Long testClassroomId;
    private String testToken;
    private List<Long> testUserIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        SystemRole defaultRole = systemRoleRepository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    SystemRole role = new SystemRole();
                    role.setName("TEST_ROLE");
                    return systemRoleRepository.save(role);
                });

        String suffix = java.util.UUID.randomUUID().toString().substring(0, 8);

        // Tạo Owner
        UserAccount owner = new UserAccount();
        owner.setUsername("owner_test_" + suffix);
        owner.setEmail("owner_" + suffix + "@test.com");
        owner.setPasswordHash("password");
        owner.setSystemRole(defaultRole);
        owner = userAccountRepository.save(owner);
        testUserIds.add(owner.getId());

        // Tạo Classroom max 5 thành viên (cho dễ test)
        AcademicContext ac = AcademicContext.builder()
                .subject("Test Concurrency")
                .semester(AcademicSeason.SPRING)
                .academicYear("2026")
                .owner(owner)
                .maxMembers(5)
                .startDate(LocalDate.now())
                .enrolledStudents(new ArrayList<>())
                .build();
        
        // Thêm trước 4 học sinh (chỉ còn trống 1 chỗ)
        for (int i = 0; i < 4; i++) {
            UserAccount student = new UserAccount();
            student.setUsername("student_in_" + i + "_" + suffix);
            student.setEmail("student_in_" + i + "_" + suffix + "@test.com");
            student.setPasswordHash("password");
            student.setSystemRole(defaultRole);
            student = userAccountRepository.save(student);
            testUserIds.add(student.getId());
            ac.getEnrolledStudents().add(student);
        }
        
        ac = academicContextRepository.save(ac);
        testClassroomId = ac.getId();
        testToken = classroomTokenUtil.generateToken(testClassroomId);

        // Tạo 10 users tranh nhau cái ghế cuối cùng
        for (int i = 0; i < 10; i++) {
            UserAccount competitor = new UserAccount();
            competitor.setUsername("competitor_" + i + "_" + suffix);
            competitor.setEmail("competitor_" + i + "_" + suffix + "@test.com");
            competitor.setPasswordHash("password");
            competitor.setSystemRole(defaultRole);
            competitor = userAccountRepository.save(competitor);
            testUserIds.add(competitor.getId());
        }
    }

    @AfterEach
    void tearDown() {
        // Dọn dẹp DB và Redis sau khi test xong
        if (testClassroomId != null) {
            academicContextRepository.deleteById(testClassroomId);
            stringRedisTemplate.delete("lock:classroom_join:" + testClassroomId);
        }
        for (Long id : testUserIds) {
            userAccountRepository.deleteById(id);
        }
        testUserIds.clear();
    }

    @Test
    void testJoinClassroomConcurrency() throws InterruptedException {
        int numberOfThreads = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            final Long userId = testUserIds.get(i);
            executorService.submit(() -> {
                try {
                    readyLatch.countDown(); // Báo hiệu thread đã sẵn sàng
                    startLatch.await(); // Đợi tất cả cùng xuất phát

                    // Gọi hàm joinClassroom
                    classroomService.joinClassroom(testToken, userId);
                    successCount.incrementAndGet();
                } catch (BadRequestException e) {
                    failCount.incrementAndGet();
                    log.info("Bị chặn đúng như dự kiến: {}", e.getMessage());
                } catch (Exception e) {
                    log.error("Lỗi không mong muốn: ", e);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Đợi tất cả thread vào vị trí
        readyLatch.await();
        // Bắn súng hiệu lệnh cho 10 thread CÙNG CHẠY MỘT LÚC
        log.info("BẮT ĐẦU TEST CONCURRENCY VỚI 10 THREAD CÙNG LÚC!");
        startLatch.countDown();
        // Chờ 10 thread chạy xong hết
        doneLatch.await();

        executorService.shutdown();

        log.info("Số người lấy được ghế: {}", successCount.get());
        log.info("Số người bị cản lại (kẹt khóa hoặc hết chỗ): {}", failCount.get());

        // Assert (Kiểm chứng kết quả)
        // Trong 10 người, chỉ được phép có TỐI ĐA 1 người thành công (vì lớp chỉ còn 1 chỗ)
        assertEquals(1, successCount.get(), "Chỉ có đúng 1 người được tham gia thành công");
        assertEquals(9, failCount.get(), "9 người còn lại phải bị văng lỗi");

        // Kiểm tra DB xem số người trong lớp có bị vượt quá 5 người không
        // Phải bọc trong Transaction để tránh lỗi LazyInitializationException khi gọi .size()
        transactionTemplate.executeWithoutResult(status -> {
            AcademicContext resultClassroom = academicContextRepository.findById(testClassroomId).get();
            assertEquals(5, resultClassroom.getEnrolledStudents().size(), "Tổng số người trong lớp không được vượt quá maxMembers (5)");
        });
    }
}
