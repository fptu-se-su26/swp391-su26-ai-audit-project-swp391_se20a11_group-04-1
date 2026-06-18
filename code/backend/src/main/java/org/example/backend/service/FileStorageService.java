package org.example.backend.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;

public interface FileStorageService {
    String storeFile(MultipartFile file) throws IOException;
    void deleteFile(String fileUrl);
    String storePrivateFile(MultipartFile file) throws IOException;
    InputStream downloadPrivateFileStream(String fileUrlOrId) throws IOException;
}
