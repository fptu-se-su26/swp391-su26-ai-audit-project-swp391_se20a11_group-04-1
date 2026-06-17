package org.example.backend.service.impl;

import org.example.backend.service.FileStorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class MockFileStorageServiceImpl implements FileStorageService {

    @Override
    public String storeFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        // TODO: Replace with actual Cloudinary/S3 logic
        // For MVP, return a mock URL or local path
        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        return "https://mock-storage.com/evidence/" + filename;
    }

    @Override
    public void deleteFile(String fileUrl) {
        // TODO: Replace with actual Cloudinary/S3 delete logic
        System.out.println("Mock deleting file: " + fileUrl);
    }
}
