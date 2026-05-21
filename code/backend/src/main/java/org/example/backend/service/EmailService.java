package org.example.backend.service;

public interface EmailService {
    
    /**
     * Sends an HTML-formatted email containing the OTP code for account verification.
     */
    void sendOtpEmail(String toEmail, String otp);

    void sendSecurityAlertEmail(String toEmail, String username, int failedAttempts, long lockTimeMinutes, String deviceInfo, String location, String unlockLink);

    /**
     * Gửi email cảnh báo khẩn cấp khi tài khoản bị tấn công từ nhiều IP khác nhau (Distributed Attack / Botnet),
     * cung cấp danh sách thiết bị vi phạm kèm nút bấm Whitelist/Block riêng biệt cho từng IP.
     */
    void sendEmergencyAttackAlertEmail(String toEmail, String username, 
                                       java.util.Map<String, String> ipDetailsMap, 
                                       java.util.Map<String, String> unlockTokensMap, 
                                       java.util.Map<String, String> blockTokensMap);
                                       
    /**
     * Gửi một email cơ bản
     */
    void sendEmail(String toEmail, String subject, String body);
}
