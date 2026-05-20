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
}
