package org.example.backend.util;

import org.example.backend.exception.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Component
public class WebhookSecretCrypto {
    // AES-GCM protects retrievable webhook secrets needed for GitHub HMAC verification.

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecureRandom secureRandom = new SecureRandom();
    private final SecretKeySpec keySpec;

    public WebhookSecretCrypto(
            @Value("${code-insight.webhook-secret-encryption-key:devtrack-ai-local-key}") String encryptionKey) {
        this.keySpec = new SecretKeySpec(deriveKey(encryptionKey), "AES");
    }

    public String encrypt(String plainText) {
        // Store iv + ciphertext so the webhook receiver can decrypt later without exposing the secret via API.
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(iv) + ":" + Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception ex) {
            throw new CustomException("Unable to encrypt webhook secret", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public String decrypt(String encryptedValue) {
        // Decrypt the saved secret only inside backend memory for HMAC verification.
        try {
            String[] parts = encryptedValue.split(":", 2);
            if (parts.length != 2) {
                throw new IllegalArgumentException("Invalid encrypted webhook secret format");
            }
            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] encrypted = Base64.getDecoder().decode(parts[1]);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new CustomException("Unable to decrypt webhook secret", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private byte[] deriveKey(String value) {
        // SHA-256 gives AES-256 key bytes from a human-readable environment/property value.
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new CustomException("Unable to initialize webhook secret encryption", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
