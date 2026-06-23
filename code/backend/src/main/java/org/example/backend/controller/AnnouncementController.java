package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AnnouncementRequest;
import org.example.backend.dto.AnnouncementResponse;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.PageResponse;
import org.example.backend.entity.UserAccount;
import org.example.backend.service.AnnouncementService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/classrooms/{classroomId}/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @PathVariable Long classroomId,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam(required = false) MultipartFile file,
            jakarta.servlet.http.HttpSession session) throws java.io.IOException {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new org.example.backend.exception.CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }

        AnnouncementResponse response = announcementService.createAnnouncement(classroomId, userId, title, content, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<AnnouncementResponse>builder()
                        .message("Announcement created successfully")
                        .data(response)
                        .build());
    }

    @GetMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamAnnouncements(
            @PathVariable Long classroomId,
            jakarta.servlet.http.HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new org.example.backend.exception.CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }
        return announcementService.subscribeToAnnouncements(classroomId);
    }

    @GetMapping("/{announcementId}/download")
    public void downloadAnnouncementAttachment(
            @PathVariable Long announcementId,
            jakarta.servlet.http.HttpServletResponse response) {
        announcementService.downloadAnnouncementAttachment(announcementId, response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AnnouncementResponse>>> getAnnouncements(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<AnnouncementResponse> response = announcementService.getAnnouncementsByClassroom(classroomId, pageable);
        
        return ResponseEntity.ok(ApiResponse.<PageResponse<AnnouncementResponse>>builder()
                .message("Announcements retrieved successfully")
                .data(response)
                .build());
    }

    @GetMapping("/tables")
    public java.util.List<String> getTables(@org.springframework.beans.factory.annotation.Autowired org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        return jdbcTemplate.queryForList("SELECT table_name FROM information_schema.tables WHERE table_schema='public'", String.class);
    }
}
