package org.example.backend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.example.backend.service.FileStorageService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@Primary // 👈 Đánh dấu ưu tiên sử dụng class này thay vì MockFileStorageServiceImpl
public class CloudinaryFileStorageServiceImpl implements FileStorageService {

    private final Cloudinary cloudinary;

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
        
        String originalFilename = file.getOriginalFilename();
        String publicId = UUID.randomUUID().toString() + "_" + originalFilename;

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicId,
                "folder", "evidence",
                "type", type
        ));

        if ("private".equals(type)) {
            // For private files, we store the full public_id (including folder) in our DB
            return "evidence/" + publicId;
        }
        return uploadResult.get("secure_url").toString();
    }

    @Override
    public String getPrivateFileUrl(String publicId) {
        if (publicId == null || publicId.isEmpty()) return null;
        // Generate a signed URL for the private resource
        return cloudinary.url()
                .resourceType("image")
                .type("private")
                .signed(true)
                .generate(publicId);
    }

    @Override
    public java.io.InputStream downloadPrivateFileStream(String publicId) throws IOException {
        String signedUrl = getPrivateFileUrl(publicId);
        if (signedUrl == null) return null;
        return new java.net.URL(signedUrl).openStream();
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
