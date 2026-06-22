package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.ClassroomResponse;
import org.example.backend.dto.CreateClassroomRequest;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.dto.ClassroomDashboardResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.ClassroomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @PostMapping
    public ResponseEntity<ApiResponse<ClassroomResponse>> createClassroom(@RequestBody CreateClassroomRequest request, HttpSession session) {
        Long userId = getUserIdFromSession(session);
        ClassroomResponse response = classroomService.createClassroom(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Tạo lớp học thành công!"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<ClassroomResponse>>> getMyClassrooms(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String search,
            HttpSession session
    ) {
        Long userId = getUserIdFromSession(session);
        PaginatedResponse<ClassroomResponse> response = classroomService.getMyClassrooms(userId, page, size, semester, search);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách lớp học thành công!"));
    }

    @GetMapping("/{id}/invite-link")
    public ResponseEntity<ApiResponse<String>> generateInviteLink(@PathVariable Long id, HttpSession session) {
        Long userId = getUserIdFromSession(session);
        String token = classroomService.generateInviteLink(id, userId);
        return ResponseEntity.ok(ApiResponse.success(token, "Tạo link mời thành công!"));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<Void>> joinClassroom(@RequestParam String token, HttpSession session) {
        Long userId = getUserIdFromSession(session);
        classroomService.joinClassroom(token, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Tham gia lớp học thành công!"));
    }

    @GetMapping("/join")
    public ResponseEntity<ApiResponse<ClassroomResponse>> getClassroomFromToken(@RequestParam String token) {
        ClassroomResponse response = classroomService.getClassroomFromToken(token);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin lớp học thành công!"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassroomResponse>> getClassroomById(@PathVariable Long id, HttpSession session) {
        Long userId = getUserIdFromSession(session);
        ClassroomResponse response = classroomService.getClassroomById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin lớp học thành công!"));
    }

    @DeleteMapping("/{id}/members/{studentId}")
    public ResponseEntity<ApiResponse<Void>> removeStudent(@PathVariable Long id, @PathVariable Long studentId, HttpSession session) {
        Long userId = getUserIdFromSession(session);
        classroomService.removeStudent(id, studentId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa học sinh khỏi lớp học thành công."));
    }

    @PostMapping("/{id}/random-groups")
    public ResponseEntity<ApiResponse<Void>> randomGroups(
            @PathVariable Long id,
            @RequestBody org.example.backend.dto.request.RandomGroupRequest request,
            HttpSession session) {
        Long userId = getUserIdFromSession(session);
        classroomService.randomGroups(id, request, userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Chia nhóm ngẫu nhiên thành công!"));
    }

    /**
     * Giải tán toàn bộ nhóm trong lớp học
     */
    @DeleteMapping("/{id}/groups")
    public ResponseEntity<ApiResponse<Void>> clearAllGroups(
            @PathVariable Long id,
            HttpSession session) {
            
        Long userId = getUserIdFromSession(session);

        classroomService.clearAllGroups(id, userId);

        return ResponseEntity.ok(ApiResponse.success(null, "Giải tán toàn bộ nhóm thành công!"));
    }

    @GetMapping("/{id}/dashboard-stats")
    public ResponseEntity<ApiResponse<ClassroomDashboardResponse>> getClassroomDashboard(
            @PathVariable Long id,
            @RequestParam(required = false) Long projectId,
            HttpSession session) {
        Long userId = getUserIdFromSession(session);
        ClassroomDashboardResponse response = classroomService.getClassroomDashboard(id, projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thống kê dashboard lớp học thành công!"));
    }

    private Long getUserIdFromSession(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
