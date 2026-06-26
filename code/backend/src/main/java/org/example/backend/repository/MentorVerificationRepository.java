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
    
    @org.springframework.data.jpa.repository.Query("SELECT r FROM MentorVerificationRequest r JOIN FETCH r.user LEFT JOIN FETCH r.user.profile WHERE r.status = :status ORDER BY r.createdAt DESC")
    List<MentorVerificationRequest> findByStatusWithUserAndProfile(@org.springframework.data.repository.query.Param("status") VerificationRequestStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM MentorVerificationRequest r JOIN FETCH r.user LEFT JOIN FETCH r.user.profile ORDER BY r.createdAt DESC")
    List<MentorVerificationRequest> findAllWithUserAndProfileOrderByCreatedAtDesc();
    
    Optional<MentorVerificationRequest> findByUserIdAndStatus(Long userId, VerificationRequestStatus status);

    List<MentorVerificationRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
}

