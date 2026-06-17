package org.example.backend.repository;

import org.example.backend.entity.MentorVerificationRequest;
import org.example.backend.entity.VerificationRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.example.backend.entity.VerificationRequestStatus;

@Repository
public interface MentorVerificationRepository extends JpaRepository<MentorVerificationRequest, Long> {

    List<MentorVerificationRequest> findByStatus(VerificationRequestStatus status);
    
    Optional<MentorVerificationRequest> findByUserIdAndStatus(Long userId, VerificationRequestStatus status);

    List<MentorVerificationRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
}

