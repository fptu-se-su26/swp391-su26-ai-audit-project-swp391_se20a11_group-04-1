package org.example.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.RegisterRequest;
import org.example.backend.dto.UserResponse;
import org.example.backend.dto.VerifyOtpRequest;
import org.example.backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
