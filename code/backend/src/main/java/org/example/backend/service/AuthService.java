package org.example.backend.service;

import jakarta.servlet.http.HttpSession;
import org.example.backend.dto.RegisterRequest;
import org.example.backend.dto.ResetPasswordRequest;
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
    UserResponse login(String usernameOrEmail, String password, HttpSession session, String ipAddress);

    /**
     * Giải phóng Khóa Toàn Cầu của tài khoản và Whitelist IP tương ứng được lấy từ token.
     * Trả về thông báo chi tiết thiết bị/địa điểm để hiển thị trên UI.
     */
    String unlockAccountByToken(String token);

    /**
     * Đưa địa chỉ IP được lấy từ token vào danh sách cấm vĩnh viễn (Blacklist).
     * Trả về IP đã bị chặn để hiển thị trên UI.
     */
    String blockIpByToken(String token);

    /**
     * Lấy thông tin tài khoản của người dùng đang đăng nhập trong session hiện tại.
     */
    UserResponse getCurrentUser(HttpSession session);

    /**
     * Cho phép tài khoản bị khóa gửi đơn kháng cáo kèm lý do và minh chứng.
     */
    void submitAppeal(Long userId, String usernameOrEmail, String reason, String evidenceUrl, String evidenceName);

    /**
     * Xử lý đăng nhập / đăng ký bằng tài khoản GitHub OAuth.
     */
    UserResponse loginWithGitHub(String email, String githubUsername, String avatarUrl, String accessToken, HttpSession session);

    /**
     * Kiểm tra sự tồn tại của Email trong hệ thống.
     */
    boolean existsByEmail(String email);

    /**
     * Đăng ký người dùng mới bằng tài khoản GitHub OAuth sau khi người dùng đồng ý.
     */
    UserResponse registerWithGitHub(String email, String githubUsername, String avatarUrl, String accessToken, HttpSession session);

    /**
     * Step 1 for forgot password: check if email exists, generate OTP, cache in Redis, send email.
     */
    void requestForgotPassword(String email);

    /**
     * Step 2 for forgot password: verify OTP, generate a short-lived resetToken, save in Redis, and return it.
     */
    String verifyForgotPasswordOtp(String email, String otp);

    /**
     * Step 3 for forgot password: verify resetToken, hash new password, save in DB, clear Redis token.
     */
    void resetPassword(ResetPasswordRequest request);
}
