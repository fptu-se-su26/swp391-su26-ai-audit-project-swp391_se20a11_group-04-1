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
        if (file == null || file.isEmpty()) {
            return null;
        }
        
        // Tạo UUID prefix để tránh trùng tên file
        String originalFilename = file.getOriginalFilename();
        String publicId = UUID.randomUUID().toString() + "_" + originalFilename;

        // Upload lên thư mục "evidence" trên Cloudinary
        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicId,
                "folder", "evidence"
        ));

        // Trả về URL bảo mật (HTTPS) của ảnh
        return uploadResult.get("secure_url").toString();
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

    @Override
    public String storePrivateFile(org.springframework.web.multipart.MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String originalFilename = file.getOriginalFilename();
        String publicId = UUID.randomUUID().toString() + "_" + originalFilename;

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "public_id", publicId,
                "folder", "private_evidence",
                "type", "private"
        ));
        return uploadResult.get("public_id").toString();
    }

    @Override
    public java.io.InputStream downloadPrivateFileStream(String publicId) throws IOException {
        if (publicId == null || publicId.isEmpty()) {
            return null;
        }
        try {
            String downloadUrl = cloudinary.url()
                    .type("private")
                    .signed(true)
                    .generate(publicId);
            return new java.net.URL(downloadUrl).openStream();
        } catch (Exception e) {
            if (publicId.startsWith("http")) {
                return new java.net.URL(publicId).openStream();
            }
            throw new IOException("Failed to download private file: " + publicId, e);
        }
    }
}
