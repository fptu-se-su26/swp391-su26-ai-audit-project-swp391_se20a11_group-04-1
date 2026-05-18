package org.example.backend.service;

import jakarta.servlet.http.HttpSession;
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

    /**
     * Authenticates user using usernameOrEmail and password, implementing Progressive Lockout with Fast-Fail via Redis.
     * Binds security context and user info to the HttpSession.
     * Receives raw Strings to eliminate LoginRequest DTO entirely.
     */
    UserResponse login(String usernameOrEmail, String password, HttpSession session);
}
