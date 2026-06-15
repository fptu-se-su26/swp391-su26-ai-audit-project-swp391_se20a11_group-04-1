package org.example.backend.service;

import org.example.backend.entity.MentorVerificationRequest;

import java.util.List;

public interface MentorVerificationService {

    MentorVerificationRequest createRequest(Long userId, String cardImageUrl);

    List<MentorVerificationRequest> getAllPendingRequests();

    List<MentorVerificationRequest> getUserRequests(Long userId);

    MentorVerificationRequest approveRequest(Long requestId, Long adminId);

    MentorVerificationRequest rejectRequest(Long requestId, Long adminId, String reason);

    void cancelRequest(Long userId);
}

