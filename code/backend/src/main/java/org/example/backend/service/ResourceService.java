package org.example.backend.service;

import org.example.backend.entity.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface ResourceService {
    Resource uploadFileResource(Long classroomId, Long uploaderId, String name, MultipartFile file);
    Resource addLinkResource(Long classroomId, Long uploaderId, String name, String url);
    List<Resource> getClassroomResources(Long classroomId);

    void downloadResource(Long classroomId, Long resourceId, jakarta.servlet.http.HttpServletResponse response);

    void deleteResource(Long classroomId, Long resourceId, Long userId);
}
