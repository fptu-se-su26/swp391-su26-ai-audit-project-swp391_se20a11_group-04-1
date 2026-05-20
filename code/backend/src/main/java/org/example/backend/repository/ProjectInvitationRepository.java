package org.example.backend.repository;

import org.example.backend.entity.ProjectInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, Long> {
    Optional<ProjectInvitation> findByToken(String token);
    Optional<ProjectInvitation> findByProjectIdAndInviteeIdAndStatus(Long projectId, Long inviteeId, org.example.backend.entity.ProjectInvitationStatus status);
    List<ProjectInvitation> findByInviteeIdAndStatus(Long inviteeId, org.example.backend.entity.ProjectInvitationStatus status);
}
