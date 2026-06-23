package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.ProfileResponse;
import org.example.backend.dto.UpdateProfileRequest;
import org.example.backend.dto.ChangePasswordRequest;
import org.example.backend.dto.ProfileStatisticsResponse;
import org.example.backend.exception.UnauthorizedException;
import org.example.backend.service.ProfileService;
import org.example.backend.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(HttpSession session) {
        Long userId = requireUserId(session);
        ProfileResponse response = profileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin profile thành công!"));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            HttpSession session) {
        Long userId = requireUserId(session);
        ProfileResponse response = profileService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật profile thành công!"));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpSession session) {
        Long userId = requireUserId(session);
        profileService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công!"));
    }

    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<ProfileStatisticsResponse>> getProfileStatistics(HttpSession session) {
        Long userId = requireUserId(session);
        ProfileStatisticsResponse response = profileService.getProfileStatistics(userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thống kê profile thành công!"));
    }

    @GetMapping("/coworkers")
    public ResponseEntity<ApiResponse<java.util.List<org.example.backend.dto.CoWorkerResponse>>> getCoWorkers(HttpSession session) {
        Long userId = requireUserId(session);
        java.util.List<org.example.backend.dto.CoWorkerResponse> response = profileService.getCoWorkers(userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách đồng nghiệp thành công!"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProfileResponse>> getUserProfile(@PathVariable Long id) {
        ProfileResponse response = profileService.getProfile(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin profile thành công!"));
    }

    @GetMapping("/{id}/statistics")
    public ResponseEntity<ApiResponse<ProfileStatisticsResponse>> getUserProfileStatistics(@PathVariable Long id) {
        ProfileStatisticsResponse response = profileService.getProfileStatistics(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thống kê profile thành công!"));
    }

    @GetMapping("/{id}/coworkers")
    public ResponseEntity<ApiResponse<java.util.List<org.example.backend.dto.CoWorkerResponse>>> getUserCoWorkers(@PathVariable Long id) {
        java.util.List<org.example.backend.dto.CoWorkerResponse> response = profileService.getCoWorkers(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách đồng nghiệp thành công!"));
    }

    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            HttpSession session) throws IOException {
        Long userId = requireUserId(session);
        String avatarUrl = fileStorageService.storeFile(file);
        return ResponseEntity.ok(ApiResponse.success(avatarUrl, "Upload ảnh đại diện thành công!"));
    }

    private Long requireUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Chưa đăng nhập hệ thống.");
        }
        return userId;
    }
}
