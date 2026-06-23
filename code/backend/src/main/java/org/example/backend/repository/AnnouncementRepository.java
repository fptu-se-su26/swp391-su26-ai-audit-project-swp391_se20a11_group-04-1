package org.example.backend.repository;

import org.example.backend.entity.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    Page<Announcement> findByClassroomIdOrderByCreatedAtDesc(Long classroomId, Pageable pageable);
}
