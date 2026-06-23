package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AnnouncementRequest;
import org.example.backend.dto.AnnouncementResponse;
import org.example.backend.dto.PageResponse;
import org.example.backend.dto.ProfileResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.*;
import org.example.backend.service.AnnouncementService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final org.example.backend.repository.AcademicContextRepository academicContextRepository;
    private final UserAccountRepository userAccountRepository;
    private final NotificationRepository notificationRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final org.example.backend.service.FileStorageService fileStorageService;

    // SSE Emitters for announcements
    private final java.util.Map<Long, java.util.List<org.springframework.web.servlet.mvc.method.annotation.SseEmitter>> projectEmitters = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    @Transactional
    public AnnouncementResponse createAnnouncement(Long classroomId, Long senderId, String title, String content, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        AcademicContext classroom = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        UserAccount sender = userAccountRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String attachmentUrl = null;
        if (file != null && !file.isEmpty()) {
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new org.example.backend.exception.BusinessException("Kích thước file đính kèm vượt quá giới hạn 10MB");
            }
            attachmentUrl = fileStorageService.storeFile(file);
            
            if (attachmentUrl != null) {
                String originalFilename = file.getOriginalFilename();
                if (originalFilename != null) {
                    attachmentUrl = attachmentUrl + "?name=" + java.net.URLEncoder.encode(originalFilename, java.nio.charset.StandardCharsets.UTF_8);
                }
            }
        }

        // Security Check: Only allow Classroom Owner (Mentor)
        boolean isAuthorized = false;
        if (classroom.getOwner() != null && classroom.getOwner().getId().equals(senderId)) {
            isAuthorized = true; // Mentor / Owner
        }

        if (!isAuthorized) {
            throw new org.example.backend.exception.CustomException("Bạn không có quyền đăng thông báo cho lớp học này.", org.springframework.http.HttpStatus.FORBIDDEN);
        }

        Announcement announcement = Announcement.builder()
                .classroom(classroom)
                .sender(sender)
                .title(title)
                .content(content)
                .attachmentUrl(attachmentUrl)
                .build();

        announcement = announcementRepository.save(announcement);

        // Notify all classroom members
        java.util.List<UserAccount> members = classroom.getEnrolledStudents();
        for (UserAccount member : members) {
            Notification notification = Notification.builder()
                    .recipient(member)
                    .title("New Announcement: " + title)
                    .message(content)
                    .type(NotificationType.MENTOR_ANNOUNCEMENT)
                    .entityType(NotificationEntityType.ANNOUNCEMENT)
                    .relatedId(announcement.getId())
                    .isRead(false)
                    .build();
            Notification savedNotif = notificationRepository.save(notification);
        }

        AnnouncementResponse responsePayload = mapToResponse(announcement);

        // Send real-time SSE notification
        java.util.List<org.springframework.web.servlet.mvc.method.annotation.SseEmitter> emitters = projectEmitters.get(classroomId);
        if (emitters != null) {
            java.util.List<org.springframework.web.servlet.mvc.method.annotation.SseEmitter> deadEmitters = new java.util.ArrayList<>();
            for (org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter : emitters) {
                try {
                    emitter.send(org.springframework.web.servlet.mvc.method.annotation.SseEmitter.event()
                            .name("NEW_ANNOUNCEMENT")
                            .data(responsePayload));
                } catch (Exception e) {
                    deadEmitters.add(emitter);
                }
            }
            emitters.removeAll(deadEmitters);
        }

        return mapToResponse(announcement);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AnnouncementResponse> getAnnouncementsByClassroom(Long classroomId, Pageable pageable) {
        Page<Announcement> page = announcementRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId, pageable);
        List<AnnouncementResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        PageResponse<AnnouncementResponse> result = new PageResponse<>();
        result.setContent(content);
        result.setPage(page.getNumber());
        result.setSize(page.getSize());
        result.setTotalElements(page.getTotalElements());
        result.setTotalPages(page.getTotalPages());
        result.setFirst(page.isFirst());
        result.setLast(page.isLast());
        return result;
    }

    @Override
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter subscribeToAnnouncements(Long classroomId) {
        org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = new org.springframework.web.servlet.mvc.method.annotation.SseEmitter(3600000L); // 1 hour timeout
        
        projectEmitters.computeIfAbsent(classroomId, k -> new java.util.concurrent.CopyOnWriteArrayList<>()).add(emitter);

        Runnable onDetach = () -> {
            java.util.List<org.springframework.web.servlet.mvc.method.annotation.SseEmitter> emitters = projectEmitters.get(classroomId);
            if (emitters != null) {
                emitters.remove(emitter);
            }
        };

        emitter.onCompletion(onDetach);
        emitter.onTimeout(onDetach);
        emitter.onError((e) -> onDetach.run());

        return emitter;
    }

    @Override
    public void downloadAnnouncementAttachment(Long announcementId, jakarta.servlet.http.HttpServletResponse response) {
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));

        String attachmentUrl = announcement.getAttachmentUrl();
        if (attachmentUrl == null || attachmentUrl.isEmpty()) {
            throw new org.example.backend.exception.BusinessException("Thông báo không có file đính kèm");
        }

        String originalName = "attachment_" + announcementId;
        String cloudinaryUrl = attachmentUrl;

        try {
            if (attachmentUrl.contains("?name=")) {
                String nameParam = attachmentUrl.substring(attachmentUrl.indexOf("?name=") + 6);
                originalName = java.net.URLDecoder.decode(nameParam, java.nio.charset.StandardCharsets.UTF_8);
                cloudinaryUrl = attachmentUrl.substring(0, attachmentUrl.indexOf("?name="));
            } else {
                int lastDot = attachmentUrl.lastIndexOf('.');
                if (lastDot > 0 && lastDot > attachmentUrl.lastIndexOf('/')) {
                    originalName += attachmentUrl.substring(lastDot);
                }
            }

            java.io.InputStream fileStream = fileStorageService.downloadPrivateFileStream(cloudinaryUrl);
            if (fileStream == null) {
                throw new org.example.backend.exception.BusinessException("Không thể tải file từ lưu trữ");
            }

            response.setContentType("application/octet-stream");
            // Set header so frontend can extract the exact filename
            response.setHeader("Content-Disposition", "attachment; filename=\"" + originalName + "\"");
            response.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

            byte[] buffer = new byte[8192];
            int bytesRead;
            java.io.OutputStream os = response.getOutputStream();
            while ((bytesRead = fileStream.read(buffer)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
            os.flush();

        } catch (Exception e) {
            throw new org.example.backend.exception.BusinessException("Lỗi tải file đính kèm: " + e.getMessage());
        }
    }

    private AnnouncementResponse mapToResponse(Announcement announcement) {
        UserAccount user = announcement.getSender();
        UserProfile profile = user.getProfile();
        ProfileResponse senderProfile = ProfileResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(profile != null ? profile.getFullName() : user.getUsername())
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .build();

        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .classroomId(announcement.getClassroom().getId())
                .sender(senderProfile)
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .attachmentUrl(announcement.getAttachmentUrl())
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .build();
    }
}
