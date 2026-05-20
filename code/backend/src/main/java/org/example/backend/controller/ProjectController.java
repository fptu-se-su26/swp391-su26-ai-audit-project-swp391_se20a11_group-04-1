package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.ProjectResponse;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.exception.CustomException;
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
            throw new CustomException.BadRequestException("Tên dự án không được để trống.");
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
    public ResponseEntity<ApiResponse<ProjectResponse.MemberDto>> inviteMember(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> payload,
            HttpSession session) {

        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            throw new CustomException.BadRequestException("Email thành viên được mời không được để trống.");
        }

        log.info("📩 Request to invite member {} to project ID: {} by user ID: {}", email, projectId, userId);

        ProjectResponse.MemberDto invitedMember = projectService.inviteMember(projectId, email, userId);

        return ResponseEntity.ok(ApiResponse.success(invitedMember, "Mời thành viên tham gia dự án thành công!"));
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
            throw new CustomException.BadRequestException("ID của Leader mới không được để trống.");
        }

        log.info("🔄 Request to change project ID: {} leader to user ID: {} by current leader ID: {}",
                projectId, newLeaderUserId, userId);

        projectService.changeProjectLeader(projectId, newLeaderUserId, userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Thay đổi Leader của dự án thành công!"));
    }
}
