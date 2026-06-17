package org.example.backend.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class ClassroomTokenUtil {

    @Value("${app.classroom.invite.secret:DevTrackClassrm1}")
    private String secretKey;

    private byte[] getKeyBytes() {
        // Ensure key is exactly 16 bytes for AES-128
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        byte[] validKey = new byte[16];
        System.arraycopy(keyBytes, 0, validKey, 0, Math.min(keyBytes.length, 16));
        return validKey;
    }

    public String generateToken(Long classroomId) {
        try {
            String data = classroomId + "|" + System.currentTimeMillis();
            SecretKeySpec secretKeySpec = new SecretKeySpec(getKeyBytes(), "AES");
            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec);
            byte[] encryptedBytes = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo link mời lớp học", e);
        }
    }

    public Long decodeToken(String token) {
        try {
            byte[] encryptedBytes = Base64.getUrlDecoder().decode(token);
            SecretKeySpec secretKeySpec = new SecretKeySpec(getKeyBytes(), "AES");
            Cipher cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec);
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            String data = new String(decryptedBytes, StandardCharsets.UTF_8);
            String[] parts = data.split("\\|");
            return Long.parseLong(parts[0]);
        } catch (Exception e) {
            return null; // Invalid token
        }
    }
}
