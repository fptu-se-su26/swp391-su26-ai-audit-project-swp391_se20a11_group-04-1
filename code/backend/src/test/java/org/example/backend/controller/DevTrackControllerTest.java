package org.example.backend.controller;

import org.example.backend.dto.PaginatedResponse;
import org.example.backend.dto.ProjectResponse;
import org.example.backend.dto.UserResponse;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.CustomException;
import org.example.backend.service.AuthService;
import org.example.backend.service.ProjectService;
import org.example.backend.service.NotificationService;
import org.example.backend.dto.NotificationResponse;
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

    @Mock
    NotificationService notificationService;

    @InjectMocks
    AuthController authController;

    @InjectMocks
    ProjectController projectController;

    @InjectMocks
    NotificationController notificationController;

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

    // =========================================================================
    // TC04 — Thay đổi vai trò thành viên
    // =========================================================================
    @Nested
    @DisplayName("TC04 — Change Member Role")
    class TC04_ChangeMemberRole {

        @Test
        @DisplayName("TC04a — Leader thay đổi vai trò thành viên thành công → 200 OK")
        void changeRoleSuccess() {
            // GIVEN
            doNothing().when(projectService).changeMemberRole(100L, 2L, "MENTOR", 1L);

            // WHEN
            ResponseEntity<?> response = projectController.changeMemberRole(
                    100L,
                    2L,
                    java.util.Map.of("role", "MENTOR"),
                    authenticatedSession
            );

            // THEN
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();
            assertThat(body.getMessage()).isEqualTo("Thay đổi vai trò thành viên thành công!");

            verify(projectService, times(1)).changeMemberRole(100L, 2L, "MENTOR", 1L);
        }

        @Test
        @DisplayName("TC04b — Không có session → Ném CustomException 401, Service không được gọi")
        void changeRoleNoSession_throws401() {
            MockHttpSession emptySession = new MockHttpSession();

            assertThatThrownBy(() ->
                    projectController.changeMemberRole(100L, 2L, java.util.Map.of("role", "MENTOR"), emptySession)
            ).isInstanceOf(CustomException.class)
             .hasMessageContaining("Vui lòng đăng nhập");

            verifyNoInteractions(projectService);
        }

        @Test
        @DisplayName("TC04c — Thiếu role → Controller ném CustomException 400 ngay")
        void changeRoleEmptyRole_throws400() {
            assertThatThrownBy(() ->
                    projectController.changeMemberRole(100L, 2L, java.util.Map.of("role", ""), authenticatedSession)
            ).isInstanceOf(CustomException.class);

            verifyNoInteractions(projectService);
        }
    }

    // =========================================================================
    // TC05 — Mời thành viên: ngăn chặn tự mời chính mình (Self-Invitation Guard)
    //
    // Kịch bản: Người dùng A (email: dattest@fpt.edu.vn) nhập chính email
    //           của mình vào ô mời → Backend phải ném BadRequestException 400.
    // =========================================================================
    @Nested
    @DisplayName("TC05 — Invite Member: Self-Invitation Guard")
    class TC05_SelfInvitationGuard {

        @Test
        @DisplayName("TC05a — Mời bằng chính email mình → Service ném BadRequestException 400")
        void inviteOwnEmail_throwsBadRequest() {
            // GIVEN: Service ném lỗi khi cùng userId
            doThrow(new BadRequestException("Bạn không thể tự mời chính mình tham gia dự án."))
                    .when(projectService).inviteMember(100L, "dattest@fpt.edu.vn", 1L);

            // WHEN + THEN
            assertThatThrownBy(() ->
                    projectController.inviteMember(
                            100L,
                            java.util.Map.of("email", "dattest@fpt.edu.vn"),
                            authenticatedSession
                    )
            ).isInstanceOf(BadRequestException.class)
             .hasMessageContaining("Bạn không thể tự mời chính mình");

            verify(projectService, times(1)).inviteMember(100L, "dattest@fpt.edu.vn", 1L);
        }

        @Test
        @DisplayName("TC05b — Mời email người khác → Service được gọi, 200 OK")
        void inviteOtherEmail_returnsOk() {
            // GIVEN: Service xử lý bình thường
            doNothing().when(projectService).inviteMember(100L, "other@fpt.edu.vn", 1L);

            // WHEN
            ResponseEntity<?> response = projectController.inviteMember(
                    100L,
                    java.util.Map.of("email", "other@fpt.edu.vn"),
                    authenticatedSession
            );

            // THEN
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();
            assertThat(body.getMessage()).contains("Mời thành viên tham gia dự án thành công");

            verify(projectService, times(1)).inviteMember(100L, "other@fpt.edu.vn", 1L);
        }

        @Test
        @DisplayName("TC05c — Email trống → Controller ném BadRequestException 400, Service không được gọi")
        void inviteEmptyEmail_throws400() {
            assertThatThrownBy(() ->
                    projectController.inviteMember(
                            100L,
                            java.util.Map.of("email", ""),
                            authenticatedSession
                    )
            ).isInstanceOf(BadRequestException.class);

            verifyNoInteractions(projectService);
        }

        @Test
        @DisplayName("TC05d — Không có session → Ném CustomException 401, Service không được gọi")
        void inviteNoSession_throws401() {
            MockHttpSession emptySession = new MockHttpSession();

            assertThatThrownBy(() ->
                    projectController.inviteMember(100L, java.util.Map.of("email", "other@fpt.edu.vn"), emptySession)
            ).isInstanceOf(CustomException.class)
             .hasMessageContaining("Vui lòng đăng nhập");

            verifyNoInteractions(projectService);
        }
    }

    // =========================================================================
    // TC06 — Notification: Ẩn nút Accept/Reject sau khi đã phản hồi
    //
    // Kịch bản: Sau khi người dùng nhấn "Đồng ý" hoặc "Từ chối" trên thanh
    //           thông báo, API phải trả 200 OK → Frontend dựa vào response
    //           thành công này để ẩn 2 nút và hiển thị trạng thái đã xử lý.
    // =========================================================================
    @Nested
    @DisplayName("TC06 — Notification: Ẩn nút Accept/Reject sau khi phản hồi")
    class TC06_NotificationHideButtons {

        @Test
        @DisplayName("TC06a — Đồng ý lời mời bằng invitationId → 200 OK, message xác nhận đã đồng ý")
        void acceptInvitationById_returnsOk_uiShouldHideButtons() {
            // GIVEN
            doNothing().when(projectService).acceptInvitation(42L, null, 1L);

            // WHEN
            ResponseEntity<?> response = projectController.acceptInvitation(
                    java.util.Map.of("invitationId", 42),
                    authenticatedSession
            );

            // THEN: 200 OK → Frontend nhận signal để ẩn nút
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();
            assertThat(body.getMessage()).isEqualTo("Đã đồng ý tham gia dự án.");

            verify(projectService, times(1)).acceptInvitation(42L, null, 1L);
        }

        @Test
        @DisplayName("TC06b — Từ chối lời mời bằng invitationId → 200 OK, message xác nhận đã từ chối")
        void rejectInvitationById_returnsOk_uiShouldHideButtons() {
            // GIVEN
            doNothing().when(projectService).rejectInvitation(42L, null, 1L);

            // WHEN
            ResponseEntity<?> response = projectController.rejectInvitation(
                    java.util.Map.of("invitationId", 42),
                    authenticatedSession
            );

            // THEN: 200 OK → Frontend nhận signal để ẩn nút và hiển thị "Đã từ chối"
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();
            assertThat(body.getMessage()).isEqualTo("Đã từ chối lời mời.");

            verify(projectService, times(1)).rejectInvitation(42L, null, 1L);
        }

        @Test
        @DisplayName("TC06c — Đồng ý bằng token (qua email link) → 200 OK")
        void acceptInvitationByToken_returnsOk() {
            // GIVEN
            String token = "abc-def-ghi-token";
            doNothing().when(projectService).acceptInvitation(null, token, 1L);

            // WHEN
            ResponseEntity<?> response = projectController.acceptInvitation(
                    java.util.Map.of("token", token),
                    authenticatedSession
            );

            // THEN
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(projectService, times(1)).acceptInvitation(null, token, 1L);
        }

        @Test
        @DisplayName("TC06d — Đã xử lý trước đó → Service ném BadRequestException (lời mời đã được xử lý)")
        void acceptAlreadyHandledInvitation_throwsBadRequest() {
            // GIVEN: Lời mời đã ACCEPTED rồi, không thể accept lần 2
            doThrow(new BadRequestException("Lời mời này đã được xử lý."))
                    .when(projectService).acceptInvitation(42L, null, 1L);

            // WHEN + THEN
            assertThatThrownBy(() ->
                    projectController.acceptInvitation(
                            java.util.Map.of("invitationId", 42),
                            authenticatedSession
                    )
            ).isInstanceOf(BadRequestException.class)
             .hasMessageContaining("Lời mời này đã được xử lý.");
        }

        @Test
        @DisplayName("TC06e — Thiếu cả token lẫn invitationId → Controller ném BadRequestException 400")
        void acceptMissingBothFields_throws400() {
            assertThatThrownBy(() ->
                    projectController.acceptInvitation(
                            java.util.Map.of(), // payload rỗng
                            authenticatedSession
                    )
            ).isInstanceOf(BadRequestException.class)
             .hasMessageContaining("Thiếu token hoặc ID lời mời.");

            verifyNoInteractions(projectService);
        }
    }

    // =========================================================================
    // TC07 — Notification Controller Tests
    // =========================================================================
    @Nested
    @DisplayName("TC07 — Notification Controller")
    class TC07_NotificationController {

        @Test
        @DisplayName("TC07a — Lấy danh sách thông báo thành công (có session) → 200 OK")
        void getMyNotificationsSuccess_returnsList() {
            // GIVEN
            NotificationResponse notif = NotificationResponse.builder()
                    .id(1L)
                    .title("Mời tham gia dự án")
                    .message("Bạn đã được mời tham gia")
                    .type("INVITATION")
                    .relatedId(10L)
                    .projectId(4L)
                    .entityType("PROJECT_INVITATION")
                    .isRead(false)
                    .invitationStatus("PENDING")
                    .build();

            when(notificationService.getMyNotifications(1L)).thenReturn(List.of(notif));

            // WHEN
            ResponseEntity<?> response = notificationController.getMyNotifications(authenticatedSession);

            // THEN
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();
            assertThat(body.getMessage()).isEqualTo("Lấy thông báo thành công.");

            @SuppressWarnings("unchecked")
            List<NotificationResponse> data = (List<NotificationResponse>) body.getData();
            assertThat(data).hasSize(1);
            assertThat(data.get(0).getId()).isEqualTo(1L);
            assertThat(data.get(0).getInvitationStatus()).isEqualTo("PENDING");
            assertThat(data.get(0).getProjectId()).isEqualTo(4L);
            assertThat(data.get(0).getEntityType()).isEqualTo("PROJECT_INVITATION");

            verify(notificationService, times(1)).getMyNotifications(1L);
        }

        @Test
        @DisplayName("TC07b — Lấy thông báo khi không đăng nhập → Ném CustomException 401")
        void getMyNotificationsNoSession_throws401() {
            MockHttpSession emptySession = new MockHttpSession();

            assertThatThrownBy(() ->
                    notificationController.getMyNotifications(emptySession)
            ).isInstanceOf(CustomException.class)
             .hasMessageContaining("Vui lòng đăng nhập");

            verifyNoInteractions(notificationService);
        }

        @Test
        @DisplayName("TC07c — Lấy số lượng thông báo chưa đọc → 200 OK")
        void getUnreadCountSuccess_returnsCount() {
            // GIVEN
            when(notificationService.getUnreadCount(1L)).thenReturn(5L);

            // WHEN
            ResponseEntity<?> response = notificationController.getUnreadCount(authenticatedSession);

            // THEN
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();

            @SuppressWarnings("unchecked")
            java.util.Map<String, Long> data = (java.util.Map<String, Long>) body.getData();
            assertThat(data.get("count")).isEqualTo(5L);

            verify(notificationService, times(1)).getUnreadCount(1L);
        }

        @Test
        @DisplayName("TC07d — Lấy số lượng thông báo chưa đọc khi không đăng nhập → Ném 401")
        void getUnreadCountNoSession_throws401() {
            MockHttpSession emptySession = new MockHttpSession();

            assertThatThrownBy(() ->
                    notificationController.getUnreadCount(emptySession)
            ).isInstanceOf(CustomException.class)
             .hasMessageContaining("Vui lòng đăng nhập");

            verifyNoInteractions(notificationService);
        }

        @Test
        @DisplayName("TC07e — Đánh dấu đã đọc thành công → 200 OK")
        void markAsReadSuccess_returnsOk() {
            // GIVEN
            doNothing().when(notificationService).markAsRead(100L, 1L);

            // WHEN
            ResponseEntity<?> response = notificationController.markAsRead(100L, authenticatedSession);

            // THEN
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();
            assertThat(body.getMessage()).isEqualTo("Đã đánh dấu đọc.");

            verify(notificationService, times(1)).markAsRead(100L, 1L);
        }

        @Test
        @DisplayName("TC07f — Đánh dấu đã đọc khi chưa đăng nhập → Ném 401")
        void markAsReadNoSession_throws401() {
            MockHttpSession emptySession = new MockHttpSession();

            assertThatThrownBy(() ->
                    notificationController.markAsRead(100L, emptySession)
            ).isInstanceOf(CustomException.class)
             .hasMessageContaining("Vui lòng đăng nhập");

            verifyNoInteractions(notificationService);
        }

        @Test
        @DisplayName("TC07g — Đánh dấu đọc tất cả thành công → 200 OK")
        void markAllAsReadSuccess_returnsOk() {
            // GIVEN
            doNothing().when(notificationService).markAllAsRead(1L);

            // WHEN
            ResponseEntity<?> response = notificationController.markAllAsRead(authenticatedSession);

            // THEN
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            var body = (org.example.backend.dto.ApiResponse<?>) response.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isTrue();
            assertThat(body.getMessage()).isEqualTo("Đã đánh dấu đọc tất cả.");

            verify(notificationService, times(1)).markAllAsRead(1L);
        }

        @Test
        @DisplayName("TC07h — Đánh dấu đọc tất cả khi chưa đăng nhập → Ném 401")
        void markAllAsReadNoSession_throws401() {
            MockHttpSession emptySession = new MockHttpSession();

            assertThatThrownBy(() ->
                    notificationController.markAllAsRead(emptySession)
            ).isInstanceOf(CustomException.class)
             .hasMessageContaining("Vui lòng đăng nhập");

            verifyNoInteractions(notificationService);
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
