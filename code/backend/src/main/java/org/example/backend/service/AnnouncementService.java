package org.example.backend.service;

import org.example.backend.dto.AnnouncementRequest;
import org.example.backend.dto.AnnouncementResponse;
import org.example.backend.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface AnnouncementService {
    AnnouncementResponse createAnnouncement(Long classroomId, Long senderId, String title, String content, org.springframework.web.multipart.MultipartFile file) throws java.io.IOException;
    PageResponse<AnnouncementResponse> getAnnouncementsByClassroom(Long classroomId, Pageable pageable);
    org.springframework.web.servlet.mvc.method.annotation.SseEmitter subscribeToAnnouncements(Long classroomId);

    void downloadAnnouncementAttachment(Long announcementId, jakarta.servlet.http.HttpServletResponse response);
}
