package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.UserResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.AuthService;
import org.example.backend.service.github.core.GitHubOAuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/github")
@RequiredArgsConstructor
@Slf4j
public class AuthGitHubController {

    private final GitHubOAuthService gitHubOAuthService;
    private final AuthService authService;

    @Value("${github.client-id}")
    private String clientId;

    @Value("${github.redirect-uri}")
    private String redirectUri;

    @GetMapping("/url")
    public ResponseEntity<ApiResponse<String>> getGitHubLoginUrl() {
        String url = String.format("https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo,read:user,user:email&prompt=consent", clientId, redirectUri);
        return ResponseEntity.ok(ApiResponse.success(url, "Success"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> loginWithGitHub(@RequestBody Map<String, String> body, HttpSession session) {
        String code = body.get("code");
        if (code == null || code.trim().isEmpty()) {
            throw new CustomException("Authorization code is required", HttpStatus.BAD_REQUEST);
        }

        // 1. Exchange code for access token
        String accessToken = gitHubOAuthService.getAccessTokenFromCode(code);

        // 2. Fetch user profile from GitHub
        Map<String, Object> profile = gitHubOAuthService.getGitHubUserProfile(accessToken);
        String email = (String) profile.get("email");
        String login = (String) profile.get("login");
        String avatarUrl = (String) profile.get("avatar_url");

        if (login == null || login.trim().isEmpty() || accessToken == null || accessToken.trim().isEmpty()) {
            throw new CustomException("GitHub did not return enough account information. Please try again.", HttpStatus.BAD_REQUEST);
        }

        // 3. Handle private email case
        if (email == null || email.trim().isEmpty()) {
            log.info("GitHub profile email is private. Fetching from user emails API...");
            email = gitHubOAuthService.getGitHubUserPrimaryEmail(accessToken);
        }

        if (email == null || email.trim().isEmpty()) {
            throw new CustomException(
                "Không thể tìm thấy email từ tài khoản GitHub của bạn. Vui lòng cấp quyền truy cập email hoặc bật email công khai trên GitHub.",
                HttpStatus.BAD_REQUEST
            );
        }

        // 4. Check if user already exists
        if (!authService.existsByEmail(email)) {
            Map<String, String> githubInfo = new HashMap<>();
            githubInfo.put("email", email);
            githubInfo.put("username", login);
            githubInfo.put("avatarUrl", avatarUrl);
            githubInfo.put("accessToken", accessToken);
            ApiResponse<Map<String, String>> errResponse = ApiResponse.<Map<String, String>>builder()
                    .success(false)
                    .errorCode("USER_NOT_REGISTERED")
                    .message("Tài khoản GitHub chưa được đăng ký trên hệ thống.")
                    .data(githubInfo)
                    .build();
            return ResponseEntity.ok(errResponse);
        }

        UserResponse userResponse = authService.loginWithGitHub(email, login, avatarUrl, accessToken, session);

        return ResponseEntity.ok(ApiResponse.success(userResponse, "Đăng nhập bằng GitHub thành công"));
    }



    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> registerWithGitHub(@RequestBody Map<String, String> body, HttpSession session) {
        String email = body.get("email");
        String username = body.get("username");
        String avatarUrl = body.get("avatarUrl");
        String accessToken = body.get("accessToken");

        if (email == null || username == null || accessToken == null) {
            throw new CustomException("Missing required fields for registration", HttpStatus.BAD_REQUEST);
        }

        UserResponse userResponse = authService.registerWithGitHub(email, username, avatarUrl, accessToken, session);
        return ResponseEntity.ok(ApiResponse.success(userResponse, "Đăng ký tài khoản bằng GitHub thành công"));
    }
}
