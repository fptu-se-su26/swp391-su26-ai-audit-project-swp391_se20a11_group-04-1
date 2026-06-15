package org.example.backend.service.impl;

import org.example.backend.service.FileStorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class MockFileStorageServiceImpl implements FileStorageService {

    @Override
    public String storeFile(MultipartFile file) {
        // Mock implementation
        System.out.println("Mock uploading file: " + file.getOriginalFilename());
        return "https://mock-storage.com/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
    }

    @Override
    public String storePrivateFile(MultipartFile file) {
        System.out.println("Mock uploading private file: " + file.getOriginalFilename());
        return "evidence/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
    }

    @Override
    public String getPrivateFileUrl(String publicId) {
        return "https://mock-storage.com/private/signed/" + publicId;
    }

    @Override
    public java.io.InputStream downloadPrivateFileStream(String publicId) {
        return new java.io.ByteArrayInputStream(new byte[0]); // Return empty stream for mock
    }

    @Override
    public void deleteFile(String fileUrl) {
        // TODO: Replace with actual Cloudinary/S3 delete logic
        System.out.println("Mock deleting file: " + fileUrl);
    }
}
