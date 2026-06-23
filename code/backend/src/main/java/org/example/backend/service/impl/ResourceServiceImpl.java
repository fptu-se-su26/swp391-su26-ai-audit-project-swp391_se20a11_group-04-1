package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.AcademicContext;
import org.example.backend.entity.Resource;
import org.example.backend.entity.ResourceType;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.BusinessException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AcademicContextRepository;
import org.example.backend.repository.ResourceRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.FileStorageService;
import org.example.backend.service.ResourceService;
import org.example.backend.util.CustomMultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final AcademicContextRepository academicContextRepository;
    private final UserAccountRepository userAccountRepository;
    private final FileStorageService fileStorageService;

    // Allowed extensions
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".doc", ".docx", ".xls", ".xlsx", ".pdf", ".txt", ".jpg", ".jpeg", ".png", ".ppt", ".pptx"
    );

    @Override
    public Resource uploadFileResource(Long classroomId, Long uploaderId, String name, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("File tải lên không được để trống");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new BusinessException("Tên tài liệu không được để trống");
        }

        AcademicContext classroom = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        UserAccount uploader = userAccountRepository.findById(uploaderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                throw new BusinessException("Tên file không hợp lệ");
            }

            // Kiểm tra kích thước file (10MB = 10 * 1024 * 1024 bytes)
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new BusinessException("Kích thước file vượt quá giới hạn 10MB");
            }

            String lowerCaseName = originalFilename.toLowerCase();
            boolean isAllowed = ALLOWED_EXTENSIONS.stream().anyMatch(lowerCaseName::endsWith);
            if (!isAllowed) {
                throw new BusinessException("Định dạng file không được hỗ trợ");
            }

            String url = fileStorageService.storeFile(file);
            
            Resource resource = Resource.builder()
                    .classroom(classroom)
                    .uploader(uploader)
                    .name(name)
                    .type(ResourceType.FILE)
                    .url(url)
                    .fileSize(file.getSize())
                    .build();

            return resourceRepository.save(resource);

        } catch (IOException e) {
            log.error("Lỗi khi tải file lên: ", e);
            throw new BusinessException("Lỗi xử lý file");
        }
    }

    @Override
    public Resource addLinkResource(Long classroomId, Long uploaderId, String name, String url) {
        if (name == null || name.trim().isEmpty() || url == null || url.trim().isEmpty()) {
            throw new BusinessException("Tên và URL không được để trống");
        }

        AcademicContext classroom = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        UserAccount uploader = userAccountRepository.findById(uploaderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        Resource resource = Resource.builder()
                .classroom(classroom)
                .uploader(uploader)
                .name(name)
                .type(ResourceType.LINK)
                .url(url)
                .fileSize(0L)
                .build();

        return resourceRepository.save(resource);
    }

    @Override
    public List<Resource> getClassroomResources(Long classroomId) {
        return resourceRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId);
    }

    @Override
    public void downloadResource(Long classroomId, Long resourceId, jakarta.servlet.http.HttpServletResponse response) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        if (!resource.getClassroom().getId().equals(classroomId)) {
            throw new BusinessException("Tài liệu không thuộc lớp học này");
        }

        if (resource.getType() != ResourceType.FILE) {
            throw new BusinessException("Không thể tải xuống tài liệu dạng link");
        }

        try {
            // Get original file stream from Cloudinary
            java.io.InputStream fileStream = fileStorageService.downloadPrivateFileStream(resource.getUrl());
            if (fileStream == null) {
                throw new BusinessException("Không thể tải file từ lưu trữ");
            }

            // Prepare ZIP output
            response.setContentType("application/zip");
            String zipFilename = resource.getName().replaceAll("[^a-zA-Z0-9.-]", "_") + ".zip";
            response.setHeader("Content-Disposition", "attachment; filename=\"" + zipFilename + "\"");

            try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(response.getOutputStream())) {
                // Folder logic as requested: "tạo ra một directory nhét vào trogn đó"
                String directoryName = resource.getName().replaceAll("[^a-zA-Z0-9.-]", "_") + "/";
                zos.putNextEntry(new java.util.zip.ZipEntry(directoryName));

                // Try to infer extension from url or fallback
                String url = resource.getUrl();
                String ext = "";
                int lastDot = url.lastIndexOf('.');
                if (lastDot > 0 && lastDot > url.lastIndexOf('/')) {
                    ext = url.substring(lastDot);
                } else {
                    ext = ".doc"; // default fallback
                }

                String fileNameInsideZip = directoryName + resource.getName().replaceAll("[^a-zA-Z0-9.-]", "_") + ext;
                zos.putNextEntry(new java.util.zip.ZipEntry(fileNameInsideZip));

                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = fileStream.read(buffer)) != -1) {
                    zos.write(buffer, 0, bytesRead);
                }
                zos.closeEntry();
            }

        } catch (Exception e) {
            log.error("Lỗi khi tải và nén file: ", e);
            throw new BusinessException("Lỗi xử lý file tải xuống");
        }
    }

    @Override
    public void deleteResource(Long classroomId, Long resourceId, Long userId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài liệu"));

        if (!resource.getClassroom().getId().equals(classroomId)) {
            throw new BusinessException("Tài liệu không thuộc lớp học này");
        }

        // Optional: Verify if user is owner of the classroom or the uploader
        if (resource.getType() == ResourceType.FILE) {
            try {
                fileStorageService.deleteFile(resource.getUrl());
            } catch (Exception e) {
                log.warn("Lỗi khi xóa file trên Cloudinary: ", e);
            }
        }
        resourceRepository.delete(resource);
    }
}
