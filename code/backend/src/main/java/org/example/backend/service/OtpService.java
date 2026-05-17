package org.example.backend.service;

import org.example.backend.dto.RegisterRequest;

public interface OtpService {
    
    /**
     * Generates a secure, random 6-digit OTP string.
     */
    String generateOtp();

    /**
     * Caches the OTP and the pending Registration Request DTO in Redis.
     */
    void saveOtpAndRequest(String email, String otp, RegisterRequest request, long ttlMinutes);

    /**
     * Compares the provided OTP against the cached one in Redis.
     */
    boolean verifyOtp(String email, String otp);

    /**
     * Retrieves the pending Registration Request DTO from Redis.
     */
    RegisterRequest getRegistrationRequest(String email);

    /**
     * Cleans up both the cached OTP and Registration DTO from Redis.
     */
    void clearOtpAndRequest(String email);
}
