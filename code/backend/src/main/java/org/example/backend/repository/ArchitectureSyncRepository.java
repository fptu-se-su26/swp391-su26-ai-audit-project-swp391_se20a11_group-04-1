package org.example.backend.repository;

import org.example.backend.entity.ArchitectureSync;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArchitectureSyncRepository extends JpaRepository<ArchitectureSync, Long> {
    Optional<ArchitectureSync> findByProjectId(Long projectId);
    boolean existsByProjectId(Long projectId);
}
