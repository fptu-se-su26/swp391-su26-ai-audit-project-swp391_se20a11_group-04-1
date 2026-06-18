package org.example.backend.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface FileStorageService {
    String storeFile(MultipartFile file) throws IOException;
    
    // Upload file as private (cannot be accessed publicly)
    String storePrivateFile(MultipartFile file) throws IOException;
    
    // Generate a secure signed URL for a private file
    String getPrivateFileUrl(String publicId);
    
    // Download the actual stream of a private file for proxying
    java.io.InputStream downloadPrivateFileStream(String publicId) throws IOException;
    
    void deleteFile(String fileUrl);
}
