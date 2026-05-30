package org.example.backend.service;

public interface EncryptionService {
    /**
     * Mã hoá một chuỗi văn bản thuần túy thành chuỗi đã mã hoá (Base64 encoded AES).
     */
    String encrypt(String plainText);

    /**
     * Giải mã chuỗi đã mã hoá (Base64 encoded AES) về lại văn bản thuần túy.
     */
    String decrypt(String encryptedText);
}
