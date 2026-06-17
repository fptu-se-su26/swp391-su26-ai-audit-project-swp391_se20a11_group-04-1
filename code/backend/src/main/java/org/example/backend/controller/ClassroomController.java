package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.ClassroomResponse;
import org.example.backend.dto.CreateClassroomRequest;
import org.example.backend.dto.PaginatedResponse;
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

    private Long getUserIdFromSession(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
