package org.example.backend.service;

public interface EmailService {
    
    /**
     * Sends an HTML-formatted email containing the OTP code for account verification.
     */
    void sendOtpEmail(String toEmail, String otp);
}
