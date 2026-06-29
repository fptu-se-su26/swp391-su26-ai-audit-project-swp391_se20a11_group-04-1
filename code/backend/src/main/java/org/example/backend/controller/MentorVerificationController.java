package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.MentorVerificationRequest;
import org.example.backend.entity.UserAccount;
import org.example.backend.service.FileStorageService;
import org.example.backend.service.MentorVerificationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/v1/mentor-verifications")
@RequiredArgsConstructor
public class MentorVerificationController {

    private final MentorVerificationService verificationService;
    private final FileStorageService fileStorageService;
    private final org.example.backend.repository.AcademicContextRepository academicContextRepository;

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

    @GetMapping("/me")
    public ResponseEntity<?> getMyRequests(@SessionAttribute("userId") Long userId) {
        List<MentorVerificationRequest> requests = verificationService.getUserRequests(userId);
        List<Map<String, Object>> response = requests.stream().map(req -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", req.getId());
            map.put("status", req.getStatus().name());
            map.put("createdAt", req.getCreatedAt());
            map.put("resolvedAt", req.getResolvedAt());
            if (req.getResolvedAt() != null) {
                map.put("expiredAt", req.getResolvedAt().plusYears(1));
            } else if (req.getCreatedAt() != null) {
                map.put("expiredAt", req.getCreatedAt().plusYears(1));
            } else {
                map.put("expiredAt", null);
            }
            map.put("message", req.getMessage());
            map.put("cardImageUrl", "/api/v1/mentor-verifications/requests/" + req.getId() + "/card-image");
            return map;
        }).toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllRequests() {
        List<MentorVerificationRequest> requests = verificationService.getAllRequests();
        
        List<Map<String, Object>> response = requests.stream().map(req -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", req.getId());
            map.put("userId", req.getUser().getId());
            map.put("username", req.getUser().getUsername());
            map.put("email", req.getUser().getEmail());
            
            String fullName = req.getUser().getProfile() != null 
                    ? req.getUser().getProfile().getFullName() 
                    : req.getUser().getUsername();
            map.put("fullName", fullName);
            
            String avatarUrl = req.getUser().getProfile() != null 
                    ? req.getUser().getProfile().getAvatarUrl() 
                    : null;
            map.put("avatarUrl", avatarUrl);
            
            map.put("status", req.getStatus().name());
            map.put("createdAt", req.getCreatedAt());
            map.put("message", req.getMessage());
            map.put("cardImageUrl", "/api/v1/mentor-verifications/requests/" + req.getId() + "/card-image");
            
            long classroomCount = academicContextRepository.countByOwnerId(req.getUser().getId());
            map.put("classroomCount", classroomCount);
            
            return map;
        }).toList();

        return ResponseEntity.ok(response);
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
            map.put("cardImageUrl", "/api/v1/mentor-verifications/requests/" + req.getId() + "/card-image");
            
            long classroomCount = academicContextRepository.countByOwnerId(req.getUser().getId());
            map.put("classroomCount", classroomCount);
            
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests/{id}/card-image")
    public ResponseEntity<InputStreamResource> getCardImage(
            @PathVariable Long id, 
            @SessionAttribute("userId") Long userId,
            @SessionAttribute(value = "userRole", required = false) String userRole) {
        try {
            MentorVerificationRequest request = verificationService.getRequestById(id);
            
            // Allow access if the user is an ADMIN or is the owner of the request
            if (!"ADMIN".equals(userRole) && !request.getUser().getId().equals(userId)) {
                System.out.println("❌ Forbidden: userRole=" + userRole + ", requestUserId=" + request.getUser().getId() + ", currentUserId=" + userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            System.out.println("🔍 Downloading image via backend for request ID: " + id + ", cardImageUrl: " + request.getCardImageUrl());
            java.io.InputStream in = fileStorageService.downloadPrivateFileStream(request.getCardImageUrl());
            if (in == null) {
                System.out.println("❌ Image InputStream is NULL for cardImageUrl: " + request.getCardImageUrl());
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE)
                    .body(new InputStreamResource(in));
        } catch (Exception e) {
            e.printStackTrace();
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
    
    @DeleteMapping("/request")
    public ResponseEntity<?> resetMyRequest(@SessionAttribute("userId") Long userId) {
        try {
            verificationService.resetVerification(userId);
            return ResponseEntity.ok(Map.of("message", "Verification reset successfully"));
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

    @GetMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamRequests() {
        return verificationService.subscribeToRequests();
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> revokeRequest(
            @PathVariable Long id,
            @SessionAttribute("userId") Long adminId,
            @RequestBody Map<String, String> payload) {
        try {
            String reason = payload.getOrDefault("reason", "No reason provided");
            MentorVerificationRequest request = verificationService.revokeRequest(id, adminId, reason);
            return ResponseEntity.ok(Map.of("message", "Request revoked successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

