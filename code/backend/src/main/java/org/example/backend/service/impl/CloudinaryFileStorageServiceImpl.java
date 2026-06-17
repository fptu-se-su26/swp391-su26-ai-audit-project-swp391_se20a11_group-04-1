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
        String ext = "";
        String baseName = originalFilename;
        if (originalFilename != null && originalFilename.contains(".")) {
            int dotIdx = originalFilename.lastIndexOf('.');
            ext = originalFilename.substring(dotIdx);
            baseName = originalFilename.substring(0, dotIdx);
        }
        
        String publicIdWithoutExt = UUID.randomUUID().toString() + "_" + baseName;
        String publicIdWithExt = publicIdWithoutExt + ext;

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicIdWithoutExt,
                "folder", "evidence",
                "type", type
        ));

        if ("private".equals(type)) {
            // For private files, we store the full public_id (including folder and extension) in our DB
            return "evidence/" + publicIdWithExt;
        }
        return uploadResult.get("secure_url").toString();
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
