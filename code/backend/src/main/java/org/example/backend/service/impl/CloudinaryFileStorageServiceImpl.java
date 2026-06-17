package org.example.backend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.exception.BusinessException;
import org.example.backend.service.FileStorageService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@Primary // 👈 Đánh dấu ưu tiên sử dụng class này thay vì MockFileStorageServiceImpl
@Slf4j
public class CloudinaryFileStorageServiceImpl implements FileStorageService {

    private final Cloudinary cloudinary;

    @org.springframework.beans.factory.annotation.Value("${cloudinary.cloud-name}")
    private String cloudName;

    @org.springframework.beans.factory.annotation.Value("${cloudinary.api-key}")
    private String apiKey;

    @org.springframework.beans.factory.annotation.Value("${cloudinary.api-secret}")
    private String apiSecret;

    public CloudinaryFileStorageServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public String storeFile(MultipartFile file) throws IOException {
        return uploadToCloudinary(file, "upload");
    }

    @Override
    public String storePrivateFile(MultipartFile file) throws IOException {
        // Return the publicId so we can generate signed URLs later
        return uploadToCloudinary(file, "private");
    }

    private String uploadToCloudinary(MultipartFile file, String type) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // Tự động fallback về link ảnh mẫu nếu đang chạy bằng tài khoản "demo"
        if ("demo".equalsIgnoreCase(cloudName) || "demo".equalsIgnoreCase(apiKey) || "demo".equalsIgnoreCase(apiSecret)) {
            log.warn("Cloudinary is running with placeholder 'demo' credentials. Falling back to a sample mock avatar URL.");
            // Danh sách một số ảnh avatar mẫu đẹp để trải nghiệm
            return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150";
        }
        
        String originalFilename = file.getOriginalFilename();
        String sanitizedFilename = originalFilename != null
                ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "upload";
                
        String ext = "";
        String baseName = sanitizedFilename;
        if (sanitizedFilename.contains(".")) {
            int dotIdx = sanitizedFilename.lastIndexOf('.');
            ext = sanitizedFilename.substring(dotIdx);
            baseName = sanitizedFilename.substring(0, dotIdx);
        }
        
        String publicIdWithoutExt = UUID.randomUUID().toString() + "_" + baseName;
        String publicIdWithExt = publicIdWithoutExt + ext;

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "public_id", publicIdWithoutExt,
                    "folder", "evidence",
                    "type", type
            ));

            if ("private".equals(type)) {
                // For private files, store the full public_id in DB
                return "evidence/" + publicIdWithExt;
            }
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            log.error("Failed to upload file to Cloudinary: {}", e.getMessage(), e);
            throw new BusinessException("Lỗi upload Cloudinary: " + e.getMessage());
        }
    }

    @Override
    public String getPrivateFileUrl(String publicId) {
        if (publicId == null || publicId.isEmpty()) return null;
        if (publicId.startsWith("http")) return publicId;
        // Generate a signed URL for the private resource
        return cloudinary.url()
                .resourceType("image")
                .type("private")
                .signed(true)
                .generate(publicId);
    }

    @Override
    public java.io.InputStream downloadPrivateFileStream(String publicId) throws IOException {
        if (publicId != null && publicId.startsWith("http")) {
            return new java.net.URL(publicId).openStream();
        }
        try {
            String signedUrl = getPrivateFileUrl(publicId);
            if (signedUrl != null) {
                return new java.net.URL(signedUrl).openStream();
            }
        } catch (IOException e) {
            System.out.println("⚠️ Failed to download as private, trying public URL... " + e.getMessage());
            // Fallback for old images that might have been uploaded as 'upload' (public) instead of 'private'
            String publicUrl = cloudinary.url().generate(publicId);
            try {
                return new java.net.URL(publicUrl).openStream();
            } catch (Exception ex) {
                System.out.println("❌ Fallback also failed: " + ex.getMessage());
                throw ex; // Re-throw if both fail
            }
        }
        return null;
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }
        try {
            if (!fileUrl.startsWith("http")) {
                // Nếu fileUrl không bắt đầu bằng http, đây chính là public_id của file private được lưu trong DB
                cloudinary.uploader().destroy(fileUrl, ObjectUtils.asMap("type", "private", "invalidate", true));
                return;
            }
            
            // Lấy public_id từ Cloudinary URL cho file public
            int uploadIdx = fileUrl.indexOf("/upload/");
            if (uploadIdx == -1) return;
            String pathAfterUpload = fileUrl.substring(uploadIdx + "/upload/".length());
            if (pathAfterUpload.matches("v\\d+/.*")) {
                pathAfterUpload = pathAfterUpload.substring(pathAfterUpload.indexOf('/') + 1);
            }
            int lastDot = pathAfterUpload.lastIndexOf('.');
            String publicIdWithFolder = lastDot > 0 ? pathAfterUpload.substring(0, lastDot) : pathAfterUpload;
            
            cloudinary.uploader().destroy(publicIdWithFolder, ObjectUtils.emptyMap());
        } catch (Exception e) {
            System.err.println("Failed to delete file from Cloudinary: " + fileUrl);
            e.printStackTrace();
        }
    }
}
