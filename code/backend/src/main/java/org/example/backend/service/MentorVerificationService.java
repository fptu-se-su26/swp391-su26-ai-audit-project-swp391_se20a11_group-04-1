package org.example.backend.service;

import org.example.backend.entity.MentorVerificationRequest;

import java.util.List;

public interface MentorVerificationService {

    MentorVerificationRequest createRequest(Long userId, String cardImageUrl);

    List<MentorVerificationRequest> getAllPendingRequests();

    List<MentorVerificationRequest> getUserRequests(Long userId);

    MentorVerificationRequest getRequestById(Long requestId);

    MentorVerificationRequest approveRequest(Long requestId, Long adminId);

    MentorVerificationRequest rejectRequest(Long requestId, Long adminId, String reason);
    
    void resetVerification(Long userId);

    void cancelRequest(Long userId);

    void checkAndExpireVerification(org.example.backend.entity.UserAccount user);
}

