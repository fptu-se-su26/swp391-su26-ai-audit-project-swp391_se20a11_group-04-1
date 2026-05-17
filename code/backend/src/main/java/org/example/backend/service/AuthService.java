package org.example.backend.service;

import org.example.backend.dto.RegisterRequest;
import org.example.backend.dto.UserResponse;
import org.example.backend.dto.VerifyOtpRequest;

public interface AuthService {
    
    /**
     * Step 1: Validates unique criteria, generates OTP, caches pending data in Redis, and sends verification email.
     */
    void requestRegistration(RegisterRequest request);

    /**
     * Step 2: Validates OTP, loads pending data, hashes password, saves entities in database, and clears cache.
     */
    UserResponse verifyOtpAndRegister(VerifyOtpRequest request);
}
