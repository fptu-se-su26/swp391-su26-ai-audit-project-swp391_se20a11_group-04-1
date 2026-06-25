package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AdminUserResponse;
import org.example.backend.dto.ResolveAppealRequest;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.UnauthorizedException;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.SystemAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemAdminUserController {

    private final SystemAdminService systemAdminService;
    private final UserAccountRepository userAccountRepository;

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String role,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "ALL") String appealFilter,
            @RequestParam(defaultValue = "false") boolean showInactiveOnly,
            HttpSession session) {
        
        requireAdmin(session);
        List<AdminUserResponse> users = systemAdminService.getUsers(search, role, status, appealFilter, showInactiveOnly);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", users
        ));
    }

    @PutMapping("/{id}/toggle-lock")
    public ResponseEntity<?> toggleLock(@PathVariable Long id, HttpSession session) {
        requireAdmin(session);
        boolean success = systemAdminService.toggleUserLock(id);
        if (!success) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Không tìm thấy tài khoản người dùng."
            ));
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Thay đổi trạng thái khóa tài khoản thành công."
        ));
    }

    @PutMapping("/appeals/{id}/resolve")
    public ResponseEntity<?> resolveAppeal(
            @PathVariable Long id,
            @RequestBody ResolveAppealRequest request,
            HttpSession session) {
        
        Long adminId = requireAdmin(session);
        UserAccount admin = userAccountRepository.findById(adminId).orElseThrow(() -> 
            new UnauthorizedException("Admin không tồn tại trong hệ thống.")
        );
        
        boolean success = systemAdminService.resolveUserAppeal(id, request.isApprove(), request.getFeedback(), admin);
        if (!success) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Giải quyết đơn kháng cáo thất bại. Vui lòng kiểm tra lại."
            ));
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Đã giải quyết đơn kháng cáo thành công."
        ));
    }

    private Long requireAdmin(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Chưa đăng nhập hệ thống.");
        }
        return userId;
    }
}
