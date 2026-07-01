package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.AdminProjectResponse;
import org.example.backend.exception.UnauthorizedException;
import org.example.backend.service.SystemAdminService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/projects")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class SystemAdminProjectController {

    private final SystemAdminService systemAdminService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProjectStats(HttpSession session) {
        requireAdmin(session);
        log.info("Admin request: get project stats");
        Map<String, Object> stats = systemAdminService.getProjectStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Lấy thông tin thống kê dự án thành công!"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminProjectResponse>>> getAdminProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean suspended,
            HttpSession session) {
        requireAdmin(session);
        log.info("Admin request: list projects - page: {}, size: {}, search: {}, status: {}, suspended: {}", 
                page, size, search, status, suspended);
        Page<AdminProjectResponse> projects = systemAdminService.getAdminProjects(page, size, search, status, suspended);
        return ResponseEntity.ok(ApiResponse.success(projects, "Lấy danh sách dự án thành công!"));
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<ApiResponse<Void>> suspendProject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        requireAdmin(session);
        String reason = body != null ? body.get("reason") : "";
        log.info("Admin request: suspend project ID {} for reason: {}", id, reason);
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Lý do đình chỉ không được để trống."));
        }
        systemAdminService.suspendProject(id, reason.trim());
        return ResponseEntity.ok(ApiResponse.success(null, "Đình chỉ dự án thành công!"));
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<ApiResponse<Void>> reactivateProject(
            @PathVariable Long id,
            HttpSession session) {
        requireAdmin(session);
        log.info("Admin request: reactivate project ID {}", id);
        systemAdminService.reactivateProject(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Kích hoạt lại dự án thành công!"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDeleteProject(
            @PathVariable Long id,
            HttpSession session) {
        requireAdmin(session);
        log.info("Admin request: soft delete project ID {}", id);
        systemAdminService.softDeleteProject(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa dự án thành công!"));
    }

    private Long requireAdmin(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Chưa đăng nhập hệ thống.");
        }
        return userId;
    }
}
