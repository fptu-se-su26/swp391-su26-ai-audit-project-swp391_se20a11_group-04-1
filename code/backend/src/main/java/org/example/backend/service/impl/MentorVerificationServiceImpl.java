package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.MentorVerificationRequest;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.VerifyStatus;
import org.example.backend.entity.VerificationRequestStatus;
import org.example.backend.repository.MentorVerificationRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.MentorVerificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MentorVerificationServiceImpl implements MentorVerificationService {

    private final MentorVerificationRepository verificationRepository;
    private final UserAccountRepository userAccountRepository;
    private final org.example.backend.service.FileStorageService fileStorageService;
    private final org.example.backend.repository.SystemRoleRepository systemRoleRepository;
    private final org.example.backend.service.NotificationService notificationService;

    @Override
    @Transactional
    public MentorVerificationRequest createRequest(Long userId, String cardImageUrl) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (VerifyStatus.VERIFIED.equals(user.getVerifyStatus())) {
            throw new RuntimeException("User is already verified");
        }

        // Check if there is already a pending request
        verificationRepository.findByUserIdAndStatus(userId, VerificationRequestStatus.PENDING)
                .ifPresent(req -> {
                    throw new RuntimeException("User already has a pending verification request");
                });

        user.setVerifyStatus(VerifyStatus.PENDING);
        userAccountRepository.save(user);

        MentorVerificationRequest request = MentorVerificationRequest.builder()
                .user(user)
                .cardImageUrl(cardImageUrl)
                .status(VerificationRequestStatus.PENDING)
                .build();

        return verificationRepository.save(request);
    }

    @Override
    public List<MentorVerificationRequest> getAllPendingRequests() {
        return verificationRepository.findByStatus(VerificationRequestStatus.PENDING);
    }

    @Override
    @Transactional
    public List<MentorVerificationRequest> getUserRequests(Long userId) {
        return verificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public MentorVerificationRequest getRequestById(Long requestId) {
        return verificationRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
    }

    @Override
    @Transactional
    public MentorVerificationRequest approveRequest(Long requestId, Long adminId) {
        MentorVerificationRequest request = verificationRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!VerificationRequestStatus.PENDING.equals(request.getStatus())) {
            throw new RuntimeException("Request is not pending");
        }

        UserAccount admin = userAccountRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        request.setStatus(VerificationRequestStatus.APPROVED);
        request.setResolvedBy(admin);
        request.setResolvedAt(LocalDateTime.now());
        verificationRepository.save(request);

        UserAccount user = request.getUser();
        user.setVerifyStatus(VerifyStatus.VERIFIED);
        userAccountRepository.save(user);

        // Lưu thông báo vào hệ thống & Push realtime
        notificationService.createAndPush(
                user,
                null,
                org.example.backend.entity.NotificationEntityType.MENTOR_VERIFICATION,
                request.getId(),
                org.example.backend.entity.NotificationType.SYSTEM,
                "Xác minh thành công",
                "Chúc mừng! Tài khoản của bạn đã được phê duyệt làm Giảng viên/Đối tác."
        );

        try {
            String wsMessage = "{\"type\":\"VERIFICATION_UPDATE\",\"data\":{\"status\":\"VERIFIED\",\"message\":\"Hồ sơ của bạn đã được duyệt!\"}}";
            org.example.backend.config.NotificationWebSocketHandler.sendToUser(user.getId(), wsMessage);
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket message: " + e.getMessage());
        }

        return request;
    }

    @Override
    @Transactional
    public MentorVerificationRequest rejectRequest(Long requestId, Long adminId, String reason) {
        MentorVerificationRequest request = verificationRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!VerificationRequestStatus.PENDING.equals(request.getStatus())) {
            throw new RuntimeException("Request is not pending");
        }

        UserAccount admin = userAccountRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        request.setStatus(VerificationRequestStatus.REJECTED);
        request.setMessage(reason);
        request.setResolvedBy(admin);
        request.setResolvedAt(LocalDateTime.now());
        verificationRepository.save(request);

        UserAccount user = request.getUser();
        user.setVerifyStatus(VerifyStatus.REJECTED);
        userAccountRepository.save(user);

        // Lưu thông báo từ chối vào hệ thống & Push realtime
        notificationService.createAndPush(
                user,
                null,
                org.example.backend.entity.NotificationEntityType.MENTOR_VERIFICATION,
                request.getId(),
                org.example.backend.entity.NotificationType.SYSTEM,
                "Yêu cầu xác minh bị từ chối",
                "Lý do từ chối: " + reason
        );

        try {
            String wsMessage = "{\"type\":\"VERIFICATION_UPDATE\",\"data\":{\"status\":\"REJECTED\",\"message\":\"Hồ sơ của bạn đã bị từ chối!\"}}";
            org.example.backend.config.NotificationWebSocketHandler.sendToUser(user.getId(), wsMessage);
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket message: " + e.getMessage());
        }

        return request;
    }

    @Override
    @Transactional
    public void cancelRequest(Long userId) {
        verificationRepository.findByUserIdAndStatus(userId, VerificationRequestStatus.PENDING)
                .ifPresent(req -> {
                    // Xóa ảnh trên Cloudinary để không tạo rác (Orphan file)
                    if (req.getCardImageUrl() != null) {
                        fileStorageService.deleteFile(req.getCardImageUrl());
                    }
                    
                    // Giữ lại bản ghi trong DB để làm lịch sử, chỉ đổi trạng thái thành CANCELLED
                    req.setStatus(VerificationRequestStatus.CANCELLED);
                    req.setResolvedAt(LocalDateTime.now());
                    verificationRepository.save(req);
                    
                    UserAccount user = req.getUser();
                    user.setVerifyStatus(VerifyStatus.UNVERIFIED);
                    userAccountRepository.save(user);
                });
    }
    @Override
    @Transactional
    public void resetVerification(Long userId) {
        // Tìm tất cả request của user
        List<MentorVerificationRequest> requests = verificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        for (MentorVerificationRequest req : requests) {
            // Xóa ảnh trên Cloudinary
            if (req.getCardImageUrl() != null) {
                fileStorageService.deleteFile(req.getCardImageUrl());
            }
            req.setStatus(VerificationRequestStatus.CANCELLED);
            req.setResolvedAt(LocalDateTime.now());
            verificationRepository.save(req);
        }
        
        UserAccount user = userAccountRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        // Khôi phục lại trạng thái ban đầu
        user.setVerifyStatus(VerifyStatus.UNVERIFIED);
        org.example.backend.entity.SystemRole userRole = systemRoleRepository.findByName("USER")
            .orElseThrow(() -> new RuntimeException("Role USER not found"));
        user.setSystemRole(userRole);
        userAccountRepository.save(user);
    }

    @Override
    @Transactional
    public void checkAndExpireVerification(UserAccount user) {
        if (VerifyStatus.VERIFIED.equals(user.getVerifyStatus())) {
            List<MentorVerificationRequest> requests = verificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            for (MentorVerificationRequest req : requests) {
                if (VerificationRequestStatus.APPROVED.equals(req.getStatus())) {
                    LocalDateTime resolvedAt = req.getResolvedAt();
                    if (resolvedAt != null && resolvedAt.isBefore(LocalDateTime.now().minusYears(1))) {
                        // Trạng thái quá hạn -> Downgrade user
                        user.setVerifyStatus(VerifyStatus.UNVERIFIED);
                        org.example.backend.entity.SystemRole userRole = systemRoleRepository.findByName("USER")
                            .orElseThrow(() -> new RuntimeException("Role USER not found"));
                        user.setSystemRole(userRole);
                        userAccountRepository.save(user);
                        
                        req.setStatus(VerificationRequestStatus.CANCELLED);
                        req.setMessage("Yêu cầu xác minh của bạn đã hết hạn (hiệu lực 1 năm).");
                        verificationRepository.save(req);
                        
                        // Tạo và lưu thông báo hệ thống, push realtime
                        notificationService.createAndPush(
                                user,
                                null,
                                org.example.backend.entity.NotificationEntityType.MENTOR_VERIFICATION,
                                req.getId(),
                                org.example.backend.entity.NotificationType.SYSTEM,
                                "Tài khoản hết hạn xác minh",
                                "Yêu cầu xác minh giảng viên của bạn đã hết hạn (hiệu lực 1 năm). Vui lòng gửi lại tài liệu mới."
                        );
                        
                        if (req.getCardImageUrl() != null) {
                            fileStorageService.deleteFile(req.getCardImageUrl());
                        }
                    }
                    break; // Chỉ check request APPROVED mới nhất
                }
            }
        }
    }
}

