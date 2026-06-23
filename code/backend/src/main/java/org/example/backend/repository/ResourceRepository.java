package org.example.backend.repository;

import org.example.backend.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);
}
