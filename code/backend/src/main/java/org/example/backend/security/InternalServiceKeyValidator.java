package org.example.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;

@Component
public class InternalServiceKeyValidator {

    @Value("${internal.service.key:1234567890abcdef}") // Cấu hình trong application.yaml
    private String expectedKey;

    public boolean isValid(String providedKey) {
        if (providedKey == null || providedKey.isEmpty()) {
            return false;
        }
        return MessageDigest.isEqual(
            providedKey.getBytes(),
            expectedKey.getBytes()
        );
    }
}
