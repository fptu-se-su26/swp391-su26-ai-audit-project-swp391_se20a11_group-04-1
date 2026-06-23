package org.example.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.entity.AcademicContext;
import org.example.backend.entity.Resource;
import org.example.backend.exception.BusinessException;
import org.example.backend.exception.CustomException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AcademicContextRepository;
import org.example.backend.service.ResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/classrooms/{classroomId}/resources")
@RequiredArgsConstructor
@Tag(name = "Resource", description = "APIs for managing classroom resources")
public class ResourceController {

    private final ResourceService resourceService;
    private final AcademicContextRepository academicContextRepository;

    @Operation(summary = "Get all resources for a classroom")
    @GetMapping
    public ResponseEntity<ApiResponse<List<Resource>>> getClassroomResources(@PathVariable Long classroomId) {
        List<Resource> resources = resourceService.getClassroomResources(classroomId);
        return ResponseEntity.ok(ApiResponse.success(resources, "Lấy danh sách tài liệu thành công"));
    }

    @GetMapping("/{resourceId}/download")
    public void downloadResource(
            @PathVariable Long classroomId,
            @PathVariable Long resourceId,
            jakarta.servlet.http.HttpServletResponse response) {
        resourceService.downloadResource(classroomId, resourceId, response);
    }

    @Operation(summary = "Upload a file resource")
    @PostMapping(value = "/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Resource>> uploadFileResource(
            @PathVariable Long classroomId,
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file,
            HttpSession session) {
        
        Long userId = getUserIdFromSession(session);
        verifyInstructorPermission(classroomId, userId);

        Resource resource = resourceService.uploadFileResource(classroomId, userId, name, file);
        return ResponseEntity.ok(ApiResponse.success(resource, "Tải tài liệu lên thành công"));
    }

    @Operation(summary = "Add a link resource")
    @PostMapping("/link")
    public ResponseEntity<ApiResponse<Resource>> addLinkResource(
            @PathVariable Long classroomId,
            @RequestParam("name") String name,
            @RequestParam("url") String url,
            HttpSession session) {

        Long userId = getUserIdFromSession(session);
        verifyInstructorPermission(classroomId, userId);

        Resource resource = resourceService.addLinkResource(classroomId, userId, name, url);
        return ResponseEntity.ok(ApiResponse.success(resource, "Thêm link thành công"));
    }

    @Operation(summary = "Delete a resource")
    @DeleteMapping("/{resourceId}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(
            @PathVariable Long classroomId,
            @PathVariable Long resourceId,
            HttpSession session) {

        Long userId = getUserIdFromSession(session);
        verifyInstructorPermission(classroomId, userId);

        resourceService.deleteResource(classroomId, resourceId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa tài liệu thành công"));
    }

    private Long getUserIdFromSession(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }

    private void verifyInstructorPermission(Long classroomId, Long userId) {
        AcademicContext classroom = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        
        if (classroom.getOwner() == null || !classroom.getOwner().getId().equals(userId)) {
            throw new BusinessException("Chỉ giảng viên mới có quyền thực hiện hành động này");
        }
    }
}
