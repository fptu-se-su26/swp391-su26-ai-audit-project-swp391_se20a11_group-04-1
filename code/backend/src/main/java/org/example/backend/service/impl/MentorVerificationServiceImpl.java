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
    public List<MentorVerificationRequest> getUserRequests(Long userId) {
        return verificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
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
        request.setRejectionReason(reason);
        request.setResolvedBy(admin);
        request.setResolvedAt(LocalDateTime.now());
        verificationRepository.save(request);

        UserAccount user = request.getUser();
        user.setVerifyStatus(VerifyStatus.REJECTED);
        userAccountRepository.save(user);

        return request;
    }

    @Override
    @Transactional
    public void cancelRequest(Long userId) {
        verificationRepository.findByUserIdAndStatus(userId, VerificationRequestStatus.PENDING)
                .ifPresent(req -> {
                    // Xóa ảnh trên Cloudinary để không tạo rác (Orphan file)
                    if (req.getCardImageUrl() != null) {
                        try {
                           fileStorageService.deleteFile(req.getCardImageUrl());
                        } catch (Exception e) {
                           System.err.println("Failed to delete Cloudinary image: " + e.getMessage());
                        }
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
}

