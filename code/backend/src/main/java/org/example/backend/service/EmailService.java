package org.example.backend.service;

public interface EmailService {
    
    /**
     * Sends an HTML-formatted email containing the OTP code for account verification.
     */
    void sendOtpEmail(String toEmail, String otp);

    /**
     * Gửi email cảnh báo bảo mật khi tài khoản bị khóa tạm thời do nhập sai mật khẩu nhiều lần (Brute-Force).
     */
    void sendSecurityAlertEmail(String toEmail, String username, int failedAttempts, long lockTimeMinutes);
}
