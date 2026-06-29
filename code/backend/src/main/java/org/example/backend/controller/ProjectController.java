package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.ProjectResponse;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.exception.BadRequestException;
import org.example.backend.service.ProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Slf4j
public class ProjectController {

    private final ProjectService projectService;

    /**
     * Lấy danh sách phân trang các dự án của tài khoản đang đăng nhập hiện tại.
     * Hỗ trợ tìm kiếm theo tên, lọc theo trạng thái và sắp xếp tùy chọn.
     * GET /api/v1/projects?page=0&size=15&status=ACTIVE&search=Event&sortBy=recent
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ProjectResponse>>> getMyProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "recent") String sortBy,
            HttpSession session) {

        // 1. Đọc userId từ Session đăng nhập của người dùng
        Long userId = (Long) session.getAttribute("userId");

        if (userId == null) {
            log.warn("Unauthorized attempt to access projects without login session.");
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        log.info("📁 Request to fetch paginated projects received from user ID: {} | Page: {}, Size: {}",
                userId, page, size);

        // 2. Gọi nghiệp vụ lấy danh sách dự án phân trang tương ứng
        PaginatedResponse<ProjectResponse> myProjects = projectService.getProjectsForUser(
                userId, page, size, status, search, sortBy);

        // 3. Trả về phản hồi chuẩn REST API
        ApiResponse<PaginatedResponse<ProjectResponse>> response = ApiResponse.success(myProjects,
                "Lấy danh sách dự án thành công!");
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/projects/{projectId}
     * Lấy chi tiết một dự án bằng ID
     */
    @GetMapping("/{projectId}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(
            @PathVariable Long projectId,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        ProjectResponse project = projectService.getProjectById(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(project, "Lấy chi tiết dự án thành công!"));
    }

    /**
     * POST /api/v1/projects
     * Tạo mới một dự án. Người tạo sẽ tự động được gán vai trò PROJECT_LEADER.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @RequestBody ProjectResponse.CreateProjectRequest request,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            log.warn("Unauthorized attempt to create project without login session.");
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        log.info("🚀 Request to create new project received from user ID: {}. Name: {}", userId, request.getName());

        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new BadRequestException("Tên dự án không được để trống.");
        }

        ProjectResponse createdProject = projectService.createProject(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(createdProject, "Tạo dự án thành công!"));
    }

    /**
     * POST /api/v1/projects/{projectId}/members/invite
     * Mời một thành viên mới vào dự án bằng email.
     */
    @PostMapping("/{projectId}/members/invite")
    public ResponseEntity<ApiResponse<Void>> inviteMember(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> payload,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email thành viên được mời không được để trống.");
        }

        log.info("📩 Request to invite member {} to project ID: {} by user ID: {}", email, projectId, userId);

        projectService.inviteMember(projectId, email, userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Mời thành viên tham gia dự án thành công! Vui lòng chờ xác nhận."));
    }

    /**
     * POST /api/v1/projects/invitations/accept
     * Đồng ý tham gia dự án
     */
    @PostMapping("/invitations/accept")
    public ResponseEntity<ApiResponse<Void>> acceptInvitation(
            @RequestBody Map<String, Object> payload,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        String token = (String) payload.get("token");
        Number invitationIdNum = (Number) payload.get("invitationId");
        Long invitationId = invitationIdNum != null ? invitationIdNum.longValue() : null;

        if ((token == null || token.trim().isEmpty()) && invitationId == null) {
            throw new BadRequestException("Thiếu token hoặc ID lời mời.");
        }

        projectService.acceptInvitation(invitationId, token, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã đồng ý tham gia dự án."));
    }

    /**
     * POST /api/v1/projects/invitations/reject
     * Từ chối tham gia dự án
     */
    @PostMapping("/invitations/reject")
    public ResponseEntity<ApiResponse<Void>> rejectInvitation(
            @RequestBody Map<String, Object> payload,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        String token = (String) payload.get("token");
        Number invitationIdNum = (Number) payload.get("invitationId");
        Long invitationId = invitationIdNum != null ? invitationIdNum.longValue() : null;

        if ((token == null || token.trim().isEmpty()) && invitationId == null) {
            throw new BadRequestException("Thiếu token hoặc ID lời mời.");
        }

        projectService.rejectInvitation(invitationId, token, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã từ chối lời mời."));
    }

    /**
     * DELETE /api/v1/projects/{projectId}/members/{memberUserId}
     * Xóa thành viên khỏi dự án
     */
    @DeleteMapping("/{projectId}/members/{memberUserId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long projectId,
            @PathVariable Long memberUserId,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        projectService.removeMember(projectId, memberUserId, userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa thành viên khỏi dự án."));
    }

    /**
     * PUT /api/v1/projects/{projectId}/leader
     * Thay đổi leader của dự án. Leader hiện tại hạ xuống MEMBER, thành viên mới lên PROJECT_LEADER.
     */
    @PutMapping("/{projectId}/leader")
    public ResponseEntity<ApiResponse<Void>> changeLeader(
            @PathVariable Long projectId,
            @RequestBody Map<String, Long> payload,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        Long newLeaderUserId = payload.get("newLeaderUserId");
        if (newLeaderUserId == null) {
            throw new BadRequestException("ID của Leader mới không được để trống.");
        }

        log.info("🔄 Request to change project ID: {} leader to user ID: {} by current leader ID: {}",
                projectId, newLeaderUserId, userId);

        projectService.changeProjectLeader(projectId, newLeaderUserId, userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Thay đổi Leader của dự án thành công!"));
    }

    /**
     * PUT /api/v1/projects/{projectId}/members/{memberUserId}/role
     * Thay đổi vai trò của thành viên trong dự án (ví dụ lên MENTOR).
     */
    @PutMapping("/{projectId}/members/{memberUserId}/role")
    public ResponseEntity<ApiResponse<Void>> changeMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long memberUserId,
            @RequestBody Map<String, String> payload,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        String newRole = payload.get("role");
        if (newRole == null || newRole.trim().isEmpty()) {
            throw new BadRequestException("Vai trò mới không được để trống.");
        }

        log.info("🔄 Request to change member role of user ID: {} in project ID: {} to role: {} by user ID: {}",
                memberUserId, projectId, newRole, userId);

        projectService.changeMemberRole(projectId, memberUserId, newRole.trim().toUpperCase(), userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Thay đổi vai trò thành viên thành công!"));
    }
}