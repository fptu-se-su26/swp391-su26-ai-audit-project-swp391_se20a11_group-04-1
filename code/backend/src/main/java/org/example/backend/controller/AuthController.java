package org.example.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import java.util.Map;
import org.example.backend.exception.BadRequestException;
import org.springframework.http.HttpStatus;
import org.example.backend.dto.RegisterRequest;
import org.example.backend.dto.UserResponse;
import org.example.backend.dto.VerifyOtpRequest;
import org.example.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Step 1: Submit Registration Info, Save to Redis, Send OTP Email.
     * POST /api/v1/auth/register/request
     */
    @PostMapping("/register/request")
    public ResponseEntity<ApiResponse<Void>> requestRegistration(@Valid @RequestBody RegisterRequest request) {
        authService.requestRegistration(request);
        ApiResponse<Void> response = ApiResponse.success("Mã OTP đã được gửi đến email của bạn. Vui lòng xác thực trong vòng 5 phút.");
        return ResponseEntity.ok(response);
    }

    /**
     * Step 2: Submit OTP, Verify, Persistence to DB, Clear Redis.
     * POST /api/v1/auth/register/verify
     */
    @PostMapping("/register/verify")
    public ResponseEntity<ApiResponse<UserResponse>> verifyOtpAndRegister(@Valid @RequestBody VerifyOtpRequest request) {
        UserResponse registeredUser = authService.verifyOtpAndRegister(request);
        ApiResponse<UserResponse> response = ApiResponse.success(registeredUser, "Đăng ký tài khoản thành công!");
        return ResponseEntity.ok(response);
    }

    /**
     * Step 3: Login, Authenticate, Session-based Session creation, IP Rate Limit, Progressive Lockout.
     * POST /api/v1/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> login(
            @RequestBody Map<String, String> payload, 
            HttpSession session, 
            HttpServletRequest request) {
        String usernameOrEmail = payload.get("usernameOrEmail");
        String password = payload.get("password");

        // Validate đầu vào nhanh chóng (Fail-Fast) bằng hiệu năng tối đa không cần Reflection DTO
        if (usernameOrEmail == null || usernameOrEmail.trim().isEmpty() 
                || !usernameOrEmail.matches("^[a-zA-Z0-9@._-]+$")) {
            throw new BadRequestException("Tên đăng nhập hoặc Email không hợp lệ.");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new BadRequestException("Mật khẩu không được để trống.");
        }

        // Lấy IP thật của Client (Hỗ trợ qua Proxy/Nginx)
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = request.getRemoteAddr();
        }

        UserResponse loginResponse = authService.login(usernameOrEmail, password, session, clientIp);
        ApiResponse<UserResponse> response = ApiResponse.success(loginResponse, "Đăng nhập thành công!");
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin người dùng hiện tại đang đăng nhập trong Session.
     * GET /api/v1/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(HttpSession session) {
        UserResponse userResponse = authService.getCurrentUser(session);
        return ResponseEntity.ok(ApiResponse.success(userResponse, "Lấy thông tin người dùng thành công!"));
    }

    /**
     * Xác nhận Whitelist IP và giải phóng khóa tài khoản toàn cầu từ email link.
     * GET /api/v1/auth/unlock
     */
    @GetMapping("/unlock")
    public ResponseEntity<String> unlockAccount(@RequestParam("token") String token) {
        try {
            String detailInfo = authService.unlockAccountByToken(token);
            String html = getSuccessHtml("Tài Khoản Đã Mở Khóa Thành Công", 
                "Hệ thống đã giải phóng trạng thái khóa toàn cầu đối với tài khoản của bạn.", 
                "Thiết bị đã được đưa vào danh sách an toàn:", detailInfo, "#10b981", "#059669");
            return ResponseEntity.ok().header("Content-Type", "text/html; charset=UTF-8").body(html);
        } catch (Exception e) {
            String html = getErrorHtml("Mở Khóa Thất Bại", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).header("Content-Type", "text/html; charset=UTF-8").body(html);
        }
    }

    /**
     * Đưa địa chỉ IP của thiết bị lạ vào danh sách cấm vĩnh viễn từ email link.
     * GET /api/v1/auth/block-ip
     */
    @GetMapping("/block-ip")
    public ResponseEntity<String> blockIp(@RequestParam("token") String token) {
        try {
            String blockedIp = authService.blockIpByToken(token);
            String html = getSuccessHtml("Đã Chặn Địa Chỉ IP Thành Công", 
                "Địa chỉ IP của thiết bị lạ đã bị chặn vĩnh viễn và không thể truy cập vào hệ thống.", 
                "Địa chỉ IP bị chặn truy cập vĩnh viễn:", blockedIp, "#ef4444", "#dc2626");
            return ResponseEntity.ok().header("Content-Type", "text/html; charset=UTF-8").body(html);
        } catch (Exception e) {
            String html = getErrorHtml("Chặn IP Thất Bại", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).header("Content-Type", "text/html; charset=UTF-8").body(html);
        }
    }

    private String getSuccessHtml(String title, String description, String label, String value, String color1, String color2) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset='utf-8'>" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "    <title>" + title + "</title>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #111827; color: #f3f4f6; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }" +
                "        .card { max-width: 500px; width: 90%; background-color: #1f2937; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #374151; padding: 40px; text-align: center; }" +
                "        .icon { width: 80px; height: 80px; background: linear-gradient(135deg, " + color1 + ", " + color2 + "); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white; font-size: 36px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }" +
                "        h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #ffffff; }" +
                "        p { font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }" +
                "        .detail-box { background-color: #111827; border-radius: 8px; padding: 16px; font-size: 14px; text-align: left; border: 1px solid #374151; margin-bottom: 30px; }" +
                "        .detail-label { font-weight: 600; color: " + color1 + "; margin-bottom: 4px; }" +
                "        .detail-value { font-family: 'Courier New', Courier, monospace; color: #e5e7eb; word-break: break-all; }" +
                "        .btn { display: inline-block; background-color: #374151; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; transition: background 0.2s; border: 1px solid #4b5563; cursor: pointer; }" +
                "        .btn:hover { background-color: #4b5563; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='card'>" +
                "        <div class='icon'>✓</div>" +
                "        <h1>" + title + "</h1>" +
                "        <p>" + description + "</p>" +
                "        <div class='detail-box'>" +
                "            <div class='detail-label'>" + label + "</div>" +
                "            <div class='detail-value'>" + value + "</div>" +
                "        </div>" +
                "        <a href='#' onclick='window.close(); return false;' class='btn'>Đóng Cửa Sổ</a>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }

    private String getErrorHtml(String title, String errorMsg) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <meta charset='utf-8'>" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "    <title>" + title + "</title>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #111827; color: #f3f4f6; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }" +
                "        .card { max-width: 500px; width: 90%; background-color: #1f2937; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #374151; padding: 40px; text-align: center; }" +
                "        .icon { width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444, #b91c1c); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; color: white; font-size: 36px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }" +
                "        h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #f87171; }" +
                "        p { font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 30px; }" +
                "        .btn { display: inline-block; background-color: #374151; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; transition: background 0.2s; border: 1px solid #4b5563; cursor: pointer; }" +
                "        .btn:hover { background-color: #4b5563; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='card'>" +
                "        <div class='icon'>✗</div>" +
                "        <h1>" + title + "</h1>" +
                "        <p>" + errorMsg + "</p>" +
                "        <a href='#' onclick='window.close(); return false;' class='btn'>Đóng Cửa Sổ</a>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }
}
