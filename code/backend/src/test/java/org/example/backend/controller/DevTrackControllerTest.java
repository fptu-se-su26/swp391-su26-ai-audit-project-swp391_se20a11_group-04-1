package org.example.backend.controller;

import org.example.backend.dto.PaginatedResponse;
import org.example.backend.dto.ProjectResponse;
import org.example.backend.dto.UserResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.AuthService;
import org.example.backend.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests covering 3 user scenarios for DevTrackAI:
 *
 *   TC01 — Đăng nhập thành công
 *   TC02 — Sau đăng nhập, hiển thị danh sách dự án (3 records đầu)
 *   TC03 — Smart Sort: thứ tự trước/sau theo deadline
 *
 * Dùng Mockito thuần (không cần Spring context / DB / Redis).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DevTrackAI — Unit Test Suite")
class DevTrackControllerTest {

    // ─── Mocks ────────────────────────────────────────────────────────────────
    @Mock
    AuthService authService;

    @Mock
    ProjectService projectService;

    @InjectMocks
    AuthController authController;

    @InjectMocks
    ProjectController projectController;

    // ─── Shared fixtures ──────────────────────────────────────────────────────
    MockHttpSession authenticatedSession;
    UserResponse mockUser;

    @BeforeEach
    void setUp() {
        mockUser = UserResponse.builder()
                .id(1L)
                .username("dattest")
                .email("dattest@fpt.edu.vn")
                .fullName("Nguyen Thanh Dat")
                .systemRole("USER")
                .isActive(true)
                .build();

        authenticatedSession = new MockHttpSession();
        authenticatedSession.setAttribute("userId", 1L);
    }

    // =========================================================================
    // TC01 — Đăng nhập thành công
    // =========================================================================
    @Nested
    @DisplayName("TC01 — Login")
    class TC01_Login {

        @Test
        @DisplayName("TC01a — Đúng thông tin → AuthService trả về UserResponse → 200 OK")
        void loginSuccess_returnsUserResponse() {
            // GIVEN
            when(authService.login(eq("dattest"), eq("Abc@12345"), any(), anyString()))
                    .thenReturn(mockUser);

            // WHEN
            ResponseEntity<?> response = authController.login(
                    java.util.Map.of("usernameOrEmail", "dattest", "password", "Abc@12345"),
                    authenticatedSession,
                    new org.springframework.mock.web.MockHttpServletRequest()
            );

            // THEN
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

            // Kiểm tra body chứa data user
            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();
            assertThat(body.getMessage()).isEqualTo("Đăng nhập thành công!");

            UserResponse data = (UserResponse) body.getData();
            assertThat(data.getId()).isEqualTo(1L);
            assertThat(data.getUsername()).isEqualTo("dattest");
            assertThat(data.getEmail()).isEqualTo("dattest@fpt.edu.vn");
            assertThat(data.getSystemRole()).isEqualTo("USER");

            verify(authService, times(1)).login(eq("dattest"), eq("Abc@12345"), any(), anyString());
        }

        @Test
        @DisplayName("TC01b — Sai mật khẩu → AuthService ném CustomException 401")
        void loginWrongPassword_throws401() {
            // GIVEN
            when(authService.login(eq("dattest"), eq("WrongPass!"), any(), anyString()))
                    .thenThrow(new CustomException("Sai tên đăng nhập hoặc mật khẩu.", HttpStatus.UNAUTHORIZED));

            // WHEN + THEN
            assertThatThrownBy(() ->
                    authController.login(
                            java.util.Map.of("usernameOrEmail", "dattest", "password", "WrongPass!"),
                            authenticatedSession,
                            new org.springframework.mock.web.MockHttpServletRequest()
                    )
            ).isInstanceOf(CustomException.class)
             .hasMessageContaining("Sai tên đăng nhập hoặc mật khẩu.");
        }

        @Test
        @DisplayName("TC01c — Thiếu password → Controller ném CustomException 400 ngay (fail-fast)")
        void loginEmptyPassword_throws400() {
            // WHEN + THEN — Controller validates before calling service
            assertThatThrownBy(() ->
                    authController.login(
                            java.util.Map.of("usernameOrEmail", "dattest", "password", ""),
                            authenticatedSession,
                            new org.springframework.mock.web.MockHttpServletRequest()
                    )
            ).isInstanceOf(CustomException.class);

            // Service không được gọi
            verifyNoInteractions(authService);
        }
    }

    // =========================================================================
    // TC02 — Sau đăng nhập, hiển thị danh sách dự án (3 records đầu)
    // =========================================================================
    @Nested
    @DisplayName("TC02 — Project List after Login")
    class TC02_ProjectList {

        @Test
        @DisplayName("TC02a — Có session hợp lệ → Trả về 3 dự án đầu tiên (page 0, size 15)")
        void afterLogin_returnsFirst3Projects() {
            // GIVEN: Backend trả về page 0 với 3 projects
            List<ProjectResponse> items = List.of(
                    buildProject("1", "EventTracker",  "ACTIVE",    LocalDate.now().plusDays(5)),
                    buildProject("2", "AuditAI Pro",   "ACTIVE",    LocalDate.now().plusDays(10)),
                    buildProject("3", "ClassManager",  "COMPLETED", LocalDate.now().minusDays(2))
            );
            PaginatedResponse<ProjectResponse> pageData = PaginatedResponse.<ProjectResponse>builder()
                    .items(items).currentPage(0).pageSize(15)
                    .totalItems(3).totalPages(1).hasMore(false)
                    .build();

            when(projectService.getProjectsForUser(1L, 0, 15, null, null, "recent"))
                    .thenReturn(pageData);

            // WHEN
            ResponseEntity<?> response = projectController.getMyProjects(
                    0, 15, null, null, "recent", authenticatedSession);

            // THEN — 200 OK với đúng 3 records
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();

            @SuppressWarnings("unchecked")
            PaginatedResponse<ProjectResponse> paged = (PaginatedResponse<ProjectResponse>) body.getData();
            assertThat(paged.getItems()).hasSize(3);
            assertThat(paged.getTotalItems()).isEqualTo(3);
            assertThat(paged.isHasMore()).isFalse();
            assertThat(paged.getItems().get(0).getTitle()).isEqualTo("EventTracker");
            assertThat(paged.getItems().get(1).getTitle()).isEqualTo("AuditAI Pro");
            assertThat(paged.getItems().get(2).getTitle()).isEqualTo("ClassManager");
        }

        @Test
        @DisplayName("TC02b — Không có session → Ném CustomException 401, Service không được gọi")
        void noSession_throws401() {
            MockHttpSession emptySession = new MockHttpSession(); // không có userId

            assertThatThrownBy(() ->
                    projectController.getMyProjects(0, 15, null, null, "recent", emptySession)
            ).isInstanceOf(CustomException.class)
             .hasMessageContaining("Vui lòng đăng nhập");

            verifyNoInteractions(projectService);
        }

        @Test
        @DisplayName("TC02c — Có 15 records, hasMore=true → Frontend biết cần tải thêm trang 2")
        void hasMoreFlag_whenBackendHasNextPage() {
            // GIVEN: Backend còn nhiều records hơn 1 trang
            List<ProjectResponse> page0Items = buildProjectList(15);
            PaginatedResponse<ProjectResponse> pageData = PaginatedResponse.<ProjectResponse>builder()
                    .items(page0Items).currentPage(0).pageSize(15)
                    .totalItems(30).totalPages(2).hasMore(true) // ← cờ quan trọng
                    .build();

            when(projectService.getProjectsForUser(1L, 0, 15, null, null, "recent"))
                    .thenReturn(pageData);

            ResponseEntity<?> response = projectController.getMyProjects(
                    0, 15, null, null, "recent", authenticatedSession);

            @SuppressWarnings("unchecked")
            PaginatedResponse<ProjectResponse> paged = (PaginatedResponse<ProjectResponse>)
                    ((org.example.backend.dto.ApiResponse<?>) response.getBody()).getData();

            // hasMore=true → Frontend kích hoạt nút "Xem thêm" và fetch page 1
            assertThat(paged.isHasMore()).isTrue();
            assertThat(paged.getTotalItems()).isEqualTo(30);
            assertThat(paged.getItems()).hasSize(15);
        }
    }

    // =========================================================================
    // TC03 — Smart Sort: thứ tự hiển thị trước/sau
    //
    // Thứ tự mong đợi (Frontend sort logic):
    //   [1] prjB — Non-overdue, deadline gần nhất (+2 ngày)
    //   [2] prjA — Non-overdue, deadline xa hơn  (+7 ngày)
    //   [3] prjD — Overdue, ít quá hạn nhất      (-1 ngày, gần hôm nay nhất)
    //   [4] prjC — Overdue, quá hạn nhiều hơn    (-5 ngày)
    //   [5] prjE — COMPLETED (luôn cuối cùng)
    // =========================================================================
    @Nested
    @DisplayName("TC03 — Smart Sort: Deadline Priority")
    class TC03_SmartSort {

        @Test
        @DisplayName("TC03a — Backend trả về đủ 5 records với deadline + status đúng để Frontend sort")
        void backendReturnsCorrectDataForFrontendSort() {
            LocalDate today = LocalDate.now();

            List<ProjectResponse> unordered = List.of(
                    buildProject("A", "PrjA +7d",   "ACTIVE",    today.plusDays(7)),
                    buildProject("B", "PrjB +2d",   "ACTIVE",    today.plusDays(2)),
                    buildProject("C", "PrjC -5d",   "ACTIVE",    today.minusDays(5)),
                    buildProject("D", "PrjD -1d",   "ACTIVE",    today.minusDays(1)),
                    buildProject("E", "PrjE done",  "COMPLETED", today.minusDays(10))
            );

            PaginatedResponse<ProjectResponse> pageData = PaginatedResponse.<ProjectResponse>builder()
                    .items(unordered).currentPage(0).pageSize(15)
                    .totalItems(5).totalPages(1).hasMore(false)
                    .build();

            when(projectService.getProjectsForUser(1L, 0, 15, null, null, "recent"))
                    .thenReturn(pageData);

            ResponseEntity<?> response = projectController.getMyProjects(
                    0, 15, null, null, "recent", authenticatedSession);

            @SuppressWarnings("unchecked")
            List<ProjectResponse> items = ((PaginatedResponse<ProjectResponse>)
                    ((org.example.backend.dto.ApiResponse<?>) response.getBody()).getData()).getItems();

            // Tất cả 5 records phải có mặt
            assertThat(items).hasSize(5);

            // Xác nhận deadline + status chính xác (dữ liệu đủ để Frontend sort)
            assertThat(items).extracting(ProjectResponse::getId)
                    .containsExactlyInAnyOrder("A", "B", "C", "D", "E");

            ProjectResponse prjB = items.stream().filter(p -> p.getId().equals("B")).findFirst().orElseThrow();
            assertThat(prjB.getDeadline()).isEqualTo(today.plusDays(2));
            assertThat(prjB.getStatus()).isEqualTo("ACTIVE");

            ProjectResponse prjE = items.stream().filter(p -> p.getId().equals("E")).findFirst().orElseThrow();
            assertThat(prjE.getStatus()).isEqualTo("COMPLETED");
        }

        @Test
        @DisplayName("TC03b — Mô phỏng Frontend sort: non-overdue gần nhất PHẢI đứng TRƯỚC overdue gần nhất")
        void frontendSort_nonOverdueBeforeOverdue() {
            LocalDate today = LocalDate.now();

            // Input từ backend (thứ tự ngẫu nhiên)
            List<ProjectResponse> fromBackend = List.of(
                    buildProject("OV", "OverdueProject",  "ACTIVE", today.minusDays(1)), // quá hạn hôm qua
                    buildProject("OK", "UpcomingProject", "ACTIVE", today.plusDays(1))   // hạn ngày mai
            );

            // Áp dụng smart sort (copy logic từ Frontend DashboardPage.jsx)
            List<ProjectResponse> sorted = fromBackend.stream()
                    .sorted(smartSortComparator(today))
                    .toList();

            // THEN: OK (non-overdue) phải đứng TRƯỚC OV (overdue)
            assertThat(sorted.get(0).getId()).isEqualTo("OK");
            assertThat(sorted.get(1).getId()).isEqualTo("OV");
        }

        @Test
        @DisplayName("TC03c — Overdue projects: ít quá hạn nhất (gần hôm nay) lên TRƯỚC")
        void frontendSort_leastOverdueFirst() {
            LocalDate today = LocalDate.now();

            List<ProjectResponse> fromBackend = List.of(
                    buildProject("C", "Old Overdue",    "ACTIVE", today.minusDays(5)),  // quá hạn 5 ngày
                    buildProject("D", "Recent Overdue", "ACTIVE", today.minusDays(1))   // quá hạn 1 ngày
            );

            List<ProjectResponse> sorted = fromBackend.stream()
                    .sorted(smartSortComparator(today))
                    .toList();

            // D (quá hạn 1 ngày = gần hôm nay nhất) phải đứng trước C (quá hạn 5 ngày)
            assertThat(sorted.get(0).getId()).isEqualTo("D");
            assertThat(sorted.get(1).getId()).isEqualTo("C");
        }

        @Test
        @DisplayName("TC03d — Completed luôn xuống cuối, bất kể deadline")
        void frontendSort_completedAlwaysLast() {
            LocalDate today = LocalDate.now();

            List<ProjectResponse> fromBackend = List.of(
                    buildProject("DONE", "DoneProject",   "COMPLETED", today.plusDays(100)), // completed nhưng deadline xa
                    buildProject("LIVE", "ActiveProject", "ACTIVE",    today.plusDays(1))    // active deadline gần
            );

            List<ProjectResponse> sorted = fromBackend.stream()
                    .sorted(smartSortComparator(today))
                    .toList();

            assertThat(sorted.get(0).getId()).isEqualTo("LIVE");
            assertThat(sorted.get(1).getId()).isEqualTo("DONE");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Tái hiện thuật toán Smart Sort từ DashboardPage.jsx (để kiểm thử Java-side) */
    private Comparator<ProjectResponse> smartSortComparator(LocalDate today) {
        return (a, b) -> {
            boolean aCompleted = "COMPLETED".equals(a.getStatus()) || "ARCHIVED".equals(a.getStatus());
            boolean bCompleted = "COMPLETED".equals(b.getStatus()) || "ARCHIVED".equals(b.getStatus());
            boolean aOverdue = !aCompleted && a.getDeadline() != null && a.getDeadline().isBefore(today);
            boolean bOverdue = !bCompleted && b.getDeadline() != null && b.getDeadline().isBefore(today);

            // Completed → cuối
            if (aCompleted != bCompleted) return aCompleted ? 1 : -1;
            // Non-overdue → trước overdue
            if (aOverdue != bOverdue) return aOverdue ? 1 : -1;
            // Cả 2 overdue → gần hôm nay nhất lên trước (DESC deadline)
            if (aOverdue) return b.getDeadline().compareTo(a.getDeadline());
            // Cả 2 non-overdue → deadline ASC
            return a.getDeadline().compareTo(b.getDeadline());
        };
    }

    private ProjectResponse buildProject(String id, String title, String status, LocalDate deadline) {
        return ProjectResponse.builder()
                .id(id).title(title).status(status).deadline(deadline)
                .major("SE").semester("Summer 2026").role("Project Leader")
                .progress(50).atRiskReqCount(0).aiInsight("On Track")
                .members(List.of()).build();
    }

    private List<ProjectResponse> buildProjectList(int count) {
        return java.util.stream.IntStream.rangeClosed(1, count)
                .mapToObj(i -> buildProject(String.valueOf(i), "Project " + i, "ACTIVE",
                        LocalDate.now().plusDays(i)))
                .toList();
    }
}
