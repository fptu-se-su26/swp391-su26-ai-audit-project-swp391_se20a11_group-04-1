package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.MentorVerificationRequest;
import org.example.backend.entity.UserAccount;
import org.example.backend.service.FileStorageService;
import org.example.backend.service.MentorVerificationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.SessionAttribute;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.core.io.InputStreamResource;
import java.util.Map;

@RestController
@RequestMapping("/api/mentor-verifications")
@RequiredArgsConstructor
public class MentorVerificationController {

    private final MentorVerificationService verificationService;
    private final FileStorageService fileStorageService;

    @PostMapping("/request")
    public ResponseEntity<?> submitRequest(
            @SessionAttribute("userId") Long userId,
            @RequestParam("idCardImage") MultipartFile file) {
        try {
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Chỉ chấp nhận file hình ảnh"));
            }
            // 1. Upload private file securely
            String publicId = fileStorageService.storePrivateFile(file);
            
            // 2. Create verification request
            MentorVerificationRequest request = verificationService.createRequest(userId, publicId);
            return ResponseEntity.ok(Map.of(
                    "message", "Verification request submitted successfully",
                    "requestId", request.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/request")
    public ResponseEntity<?> cancelRequest(@SessionAttribute("userId") Long userId) {
        try {
            verificationService.cancelRequest(userId);
            return ResponseEntity.ok(Map.of("message", "Verification request cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyRequests(@SessionAttribute("userId") Long userId) {
        List<MentorVerificationRequest> requests = verificationService.getUserRequests(userId);
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingRequests() {
        List<MentorVerificationRequest> requests = verificationService.getAllPendingRequests();
        
        // Convert to DTOs. DO NOT expose Cloudinary URLs!
        List<Map<String, Object>> response = requests.stream().map(req -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", req.getId());
            map.put("userId", req.getUser().getId());
            map.put("username", req.getUser().getUsername());
            map.put("email", req.getUser().getEmail());
            map.put("status", req.getStatus().name());
            map.put("createdAt", req.getCreatedAt());
            // Use internal proxy URL to ensure 100% security
            map.put("cardImageUrl", "/api/mentor-verifications/requests/" + req.getId() + "/card-image");
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests/{id}/card-image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InputStreamResource> getCardImage(@PathVariable Long id, @SessionAttribute("userId") Long adminId) {
        try {
            // Find request. Ideally add a method in service to get by ID securely.
            // Using a shortcut stream for MVP logic (in real app, use Service layer)
            MentorVerificationRequest request = verificationService.getAllPendingRequests().stream()
                    .filter(r -> r.getId().equals(id))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Request not found"));
            
            java.io.InputStream in = fileStorageService.downloadPrivateFileStream(request.getCardImageUrl());
            if (in == null) return ResponseEntity.notFound().build();
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
                    .body(new InputStreamResource(in));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long id,
            @SessionAttribute("userId") Long adminId) {
        try {
            MentorVerificationRequest request = verificationService.approveRequest(id, adminId);
            return ResponseEntity.ok(Map.of("message", "Request approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long id,
            @SessionAttribute("userId") Long adminId,
            @RequestBody Map<String, String> payload) {
        try {
            String reason = payload.getOrDefault("reason", "No reason provided");
            MentorVerificationRequest request = verificationService.rejectRequest(id, adminId, reason);
            return ResponseEntity.ok(Map.of("message", "Request rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

