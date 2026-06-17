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
        if (file == null || file.isEmpty()) {
            return null;
        }

        // Tự động fallback về link ảnh mẫu nếu đang chạy bằng tài khoản "demo"
        if ("demo".equalsIgnoreCase(cloudName) || "demo".equalsIgnoreCase(apiKey) || "demo".equalsIgnoreCase(apiSecret)) {
            log.warn("Cloudinary is running with placeholder 'demo' credentials. Falling back to a sample mock avatar URL.");
            // Danh sách một số ảnh avatar mẫu đẹp để trải nghiệm
            return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150";
        }
        
        // Tạo UUID prefix để tránh trùng tên file
        String originalFilename = file.getOriginalFilename();
        String publicId = UUID.randomUUID().toString() + "_" + originalFilename;

        try {
            // Upload lên thư mục "evidence" trên Cloudinary
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "public_id", publicId,
                    "folder", "evidence"
            ));

            // Trả về URL bảo mật (HTTPS) của ảnh
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            log.error("Failed to upload file to Cloudinary: {}", e.getMessage(), e);
            throw new BusinessException("Lỗi upload Cloudinary: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return;
        }
        try {
            // Lấy public_id từ URL (Cloudinary URL format: .../upload/v1234/folder/public_id.ext)
            String[] parts = fileUrl.split("/");
            String filename = parts[parts.length - 1];
            String publicIdWithFolder = "evidence/" + filename.substring(0, filename.lastIndexOf('.'));
            
            cloudinary.uploader().destroy(publicIdWithFolder, ObjectUtils.emptyMap());
        } catch (Exception e) {
            System.err.println("Failed to delete file from Cloudinary: " + fileUrl);
            e.printStackTrace();
        }
    }
}
